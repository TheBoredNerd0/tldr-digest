const test = require("node:test");
const assert = require("node:assert/strict");
const {
  todayInSingapore, buildFeatured, mergeEditions, dedupeAcrossEditions, escapeMdV2,
  EXPECTED_SOURCES, findMissingSources, persistentlyMissing,
} = require("../publish");
const { parseEdition } = require("../scrape");
const { escapeMarkdownV2, buildEditionDigest, TELEGRAM_MAX_LEN } = require("../format");
const { fetchRssSource, fetchWithRetry, stripHtml } = require("../sources/rss");
const { parseDayHtml, stripBadge } = require("../scripts/backfill");

const a = (n) => ({ headline: `H${n}`, url: `https://e.x/${n}`, readTime: null, blurb: "" });
const ed = (name, ...arts) => ({ name, sections: [{ title: name, articles: arts }] });

test("todayInSingapore is an ISO date", () => {
  assert.match(todayInSingapore(), /^\d{4}-\d{2}-\d{2}$/);
});

test("dedupeAcrossEditions keeps the first occurrence and drops emptied editions", () => {
  const out = dedupeAcrossEditions([ed("A", a(1), a(2)), ed("B", a(2)), ed("C", a(3), a(1))]);
  assert.deepEqual(out.map((e) => e.name), ["A", "C"]);
  assert.deepEqual(out[1].sections[0].articles.map((x) => x.url), ["https://e.x/3"]);
});

test("mergeEditions turns outlets into titled sub-sections and keeps each outlet's badge", () => {
  const out = mergeEditions([ed("BBC World", a(1)), ed("Empty"), ed("DW", a(2))], "World News");
  assert.equal(out.name, "World News");
  assert.deepEqual(out.sections.map((s) => s.title), ["BBC World", "DW"]);
  assert.equal(out.sections[1].articles[0].sourceLabel, "DW");
});

test("buildFeatured pulls AI-lab picks + GitHub repos, tagged with their origin", () => {
  const f = buildFeatured([ed("TLDR AI", a(1), a(2), a(3), a(4)), ed("GitHub Trending", a(5)), ed("BBC World", a(6))]);
  const picks = f.sections[0].articles;
  assert.deepEqual(picks.map((x) => x.url), ["https://e.x/1", "https://e.x/2", "https://e.x/3", "https://e.x/5"]);
  assert.equal(picks[3].sourceLabel, "GitHub Trending");
});

test("MarkdownV2 escaping covers every reserved character", () => {
  const reserved = "_*[]()~`>#+-=|{}.!\\";
  assert.equal(escapeMdV2(reserved), reserved.split("").map((c) => `\\${c}`).join(""));
  assert.equal(escapeMarkdownV2("a.b"), "a\\.b");
});

test("buildEditionDigest splits long editions under Telegram's limit", () => {
  const many = Array.from({ length: 60 }, (_, i) => ({ ...a(i), blurb: "x".repeat(250) }));
  const parts = buildEditionDigest("AI", "2026-10-20", [{ title: "S", articles: many }]);
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(p.length <= TELEGRAM_MAX_LEN);
});

test("parseEdition reads tldr.tech markup, skipping sponsors", () => {
  const html = `
    <section><header><h3>Big Tech</h3></header>
      <article><a class="font-bold" href="https://x.y/1?utm=1"><h3>Story one (3 minute read)</h3></a>
        <div class="newsletter-html">Blurb one</div></article>
      <article><a href="https://ad.y/"><h3>Buy now (Sponsor)</h3></a></article>
    </section>
    <section><header><h3></h3></header><article><a href="https://x.y/2">ignored</a></article></section>`;
  const { sections } = parseEdition(html, "2026-10-20");
  assert.equal(sections.length, 1);
  assert.deepEqual(sections[0].articles, [{ headline: "Story one", url: "https://x.y/1", readTime: "3 min", blurb: "Blurb one" }]);
});

test("stripHtml joins paragraphs with spaces", () => {
  assert.equal(stripHtml("<p>One.</p><p>Two.</p>"), "One. Two.");
});

function withFetch(responses, fn) {
  const real = global.fetch;
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    const r = responses.shift();
    if (r instanceof Error) throw r;
    return { ok: r.status < 400, status: r.status, text: async () => r.body || "" };
  };
  return fn(calls).finally(() => { global.fetch = real; });
}

test("fetchWithRetry retries once on 502 / network errors, not on 404", async () => {
  await withFetch([{ status: 502 }, { status: 200 }], async (calls) => {
    assert.equal((await fetchWithRetry("u", { delayMs: 0 })).status, 200);
    assert.equal(calls.length, 2);
  });
  await withFetch([new Error("ECONNRESET"), { status: 200 }], async (calls) => {
    assert.equal((await fetchWithRetry("u", { delayMs: 0 })).status, 200);
    assert.equal(calls.length, 2);
  });
  await withFetch([{ status: 404 }], async (calls) => {
    assert.equal((await fetchWithRetry("u", { delayMs: 0 })).status, 404);
    assert.equal(calls.length, 1);
  });
});

test("fetchRssSource parses items, strips query strings, honours limit", async () => {
  const body = `<?xml version="1.0"?><rss><channel>
    <item><title>One</title><link>https://n.x/1?utm=a</link><description>&lt;p&gt;Hi&lt;/p&gt;</description></item>
    <item><title>Two</title><link>https://n.x/2</link></item>
    <item><title>Three</title><link>https://n.x/3</link></item></channel></rss>`;
  await withFetch([{ status: 200, body }], async () => {
    const out = await fetchRssSource({ name: "N", url: "u", limit: 2, retryDelayMs: 0 });
    assert.deepEqual(out.sections[0].articles.map((x) => [x.headline, x.url, x.blurb]), [
      ["One", "https://n.x/1", "Hi"],
      ["Two", "https://n.x/2", ""],
    ]);
  });
  await withFetch([{ status: 502 }, { status: 503 }], async () => {
    await assert.rejects(fetchRssSource({ name: "N", url: "u", retryDelayMs: 0 }), /N: HTTP 503/);
  });
});

test("backfill parses the original July 2026 card format", () => {
  const html = `<section id="tldr-ai"><details class="edition-toggle">
    <summary class="edition">🤖 TLDR AI <span class="count">1</span></summary>
    <h3 class="section">Headlines &amp; Launches</h3><div class="grid">
    <div class="card"><img class="cover" src="https://i.x/1.jpg" loading="lazy" alt="">
      <span class="source">🤖 TLDR AI</span>
      <details><summary>Grok 4.5<span class="readtime">3 min</span></summary>
      <p class="blurb">It shipped. <a href="https://x.ai/news/grok-4-5">Read more →</a></p></details></div>
    </div></details></section>`;
  assert.deepEqual(parseDayHtml(html), [
    { name: "TLDR AI", sections: [{ title: "Headlines & Launches", articles: [
      { headline: "Grok 4.5", url: "https://x.ai/news/grok-4-5", readTime: "3 min", blurb: "It shipped.", image: "https://i.x/1.jpg" },
    ] }] },
  ]);
  assert.equal(stripBadge("🇸🇬 Straits Times"), "Straits Times");
});

test("findMissingSources flags sources that errored *or* returned nothing", () => {
  const raw = [ed("TLDR AI", a(1)), ed("The Rundown AI"), ed("BBC World", a(2))];
  assert.deepEqual(findMissingSources(["TLDR AI", "The Rundown AI", "BBC World", "DW"], raw), ["The Rundown AI", "DW"]);
  assert.ok(EXPECTED_SOURCES.includes("MIT Technology Review AI"));
  assert.ok(EXPECTED_SOURCES.includes("TLDR Hardware"));
  assert.equal(new Set(EXPECTED_SOURCES).size, EXPECTED_SOURCES.length, "no duplicate source names");
});

test("persistentlyMissing needs the source gone today and on the two days before", () => {
  const prev = [{ missingSources: ["DW", "SCMP"] }, { missingSources: ["DW"] }];
  assert.deepEqual(persistentlyMissing(["DW", "SCMP", "NPR World"], prev), ["DW"]);
  assert.deepEqual(persistentlyMissing(["DW"], [{ missingSources: ["DW"] }]), [], "not enough history yet");
});

test("fetchRssSource also reads Atom feeds", async () => {
  const body = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
    <entry><title>Atom one</title><link rel="alternate" href="https://a.x/1?ref=feed"/><link rel="self" href="https://a.x/self"/>
      <summary type="html">&lt;p&gt;Short.&lt;/p&gt;</summary></entry>
    <entry><title>Atom two</title><link href="https://a.x/2"/><content type="html">${"word ".repeat(200)}</content></entry>
  </feed>`;
  await withFetch([{ status: 200, body }], async () => {
    const [one, two] = (await fetchRssSource({ name: "A", url: "u", retryDelayMs: 0 })).sections[0].articles;
    assert.deepEqual([one.headline, one.url, one.blurb], ["Atom one", "https://a.x/1", "Short."]);
    assert.equal(two.url, "https://a.x/2");
    assert.ok(two.blurb.length <= 401 && two.blurb.endsWith("…"));
  });
});
