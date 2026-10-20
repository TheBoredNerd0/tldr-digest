const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MONTHS,
  dateToSlug,
  slugToIso,
  formatLongDate,
  escapeHtml,
  safeUrl,
  buildDailyHtml,
  buildIndexHtml,
  buildFeedXml,
} = require("../html");

const article = (over = {}) => ({
  headline: "Model ships",
  url: "https://example.com/a",
  readTime: "3 min",
  blurb: "A short summary.",
  image: "https://example.com/a.jpg",
  ...over,
});

test("dateToSlug and slugToIso round-trip every month", () => {
  MONTHS.forEach((_, i) => {
    const iso = `2026-${String(i + 1).padStart(2, "0")}-09`;
    assert.equal(slugToIso(dateToSlug(iso)), iso);
  });
  assert.equal(dateToSlug("2026-10-20"), "20-october-2026");
});

test("formatLongDate gives the right weekday regardless of host timezone", () => {
  assert.equal(formatLongDate("2026-10-20"), "Tuesday 20 October 2026");
  assert.equal(formatLongDate("2026-07-09", { weekday: "short" }), "Thu");
  assert.equal(formatLongDate("2026-10-01", { month: "long", year: "numeric" }), "October 2026");
  assert.equal(formatLongDate("2026-02-28", { day: "numeric", month: "short" }), "28 Feb");
});

test("escapeHtml escapes quotes as well as markup", () => {
  assert.equal(escapeHtml(`<a href="x" onclick='y'>&`), "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;");
});

test("safeUrl only lets http(s) through", () => {
  assert.equal(safeUrl("https://a.b/c"), "https://a.b/c");
  assert.equal(safeUrl(" http://a.b "), "http://a.b");
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html,x"), null);
  assert.equal(safeUrl(null), null);
});

test("buildDailyHtml escapes scraped text and neutralises unsafe URLs", () => {
  const html = buildDailyHtml("2026-10-20", [
    {
      name: "AI",
      sections: [
        {
          title: "TLDR AI",
          articles: [
            article({ headline: `<img src=x onerror=alert(1)>`, url: "javascript:alert(1)", image: "javascript:x" }),
          ],
        },
      ],
    },
  ]);
  assert.ok(!html.includes("<img src=x"), "headline must be escaped");
  assert.ok(!html.includes("javascript:"), "unsafe URLs must not be emitted");
  assert.ok(html.includes('data-url="#"'));
});

test("buildDailyHtml: no duplicate data-blurb payload, labelled search, day nav", () => {
  const html = buildDailyHtml("2026-10-20", [{ name: "AI", sections: [{ title: "x", articles: [article()] }] }]);
  assert.ok(!html.includes("data-blurb="));
  assert.match(html, /<label class="sr-only" for="search-input">/);
  assert.match(html, /class="daynav" data-date="2026-10-20"/);
  assert.match(html, /<title>TLDR Digest — Tuesday 20 October 2026<\/title>/);
  assert.match(html, /property="og:image" content="https:\/\/example.com\/a.jpg"/);
  assert.match(html, /class="save"/);
});

test("buildDailyHtml: inline script has no syntax errors", () => {
  const html = buildDailyHtml("2026-10-20", [{ name: "AI", sections: [{ title: "x", articles: [article()] }] }]);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 2);
  for (const src of scripts) assert.doesNotThrow(() => new Function(src));
});

test("buildIndexHtml lists days in the order given and groups by month", () => {
  const manifest = [
    { date: "2026-10-20", slug: "20-october-2026", count: 10, topics: 8, top: ["A", "B"], image: null },
    { date: "2026-09-30", slug: "30-september-2026", count: 9, topics: 8, top: ["C"], image: null },
    { date: "2026-07-31", slug: "31-july-2026", count: 8, topics: 8, top: [], image: null },
  ];
  const html = buildIndexHtml(manifest);
  const order = [...html.matchAll(/class="day-row" href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ["20-october-2026.html", "30-september-2026.html", "31-july-2026.html"]);
  const months = [...html.matchAll(/<h2 id="m-[^"]+">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(months, ["October 2026", "September 2026", "July 2026"]);
  assert.match(html, /class="lead" href="20-october-2026.html"/);
});

test("buildFeedXml produces one item per day with absolute links", () => {
  const xml = buildFeedXml(
    [{ date: "2026-10-20", slug: "20-october-2026", count: 3, top: ["A & B"], image: null }],
    { siteUrl: "https://x.test/d" }
  );
  assert.equal((xml.match(/<item>/g) || []).length, 1);
  assert.match(xml, /<link>https:\/\/x.test\/d\/20-october-2026.html<\/link>/);
  assert.match(xml, /<pubDate>Tue, 20 Oct 2026 00:00:00 GMT<\/pubDate>/);
  assert.ok(!/<li>A & B/.test(xml), "description must be XML-escaped");
});
