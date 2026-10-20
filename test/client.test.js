// Runs the real in-page script (assets/site.js) against real generated pages in
// jsdom, so the client features (save, search, filters, archive marks, search
// page, image fallback) are covered by `npm test`, not just by hand in a browser.
const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { ASSETS, buildDailyHtml, buildIndexHtml, buildSavedHtml, buildSearchHtml } = require("../html");

const SCRIPT = ASSETS["assets/site.js"];

const art = (headline, url, extra = {}) => ({ headline, url, blurb: `${headline} blurb`, image: null, ...extra });
const EDITIONS = [
  { name: "Featured", sections: [{ title: "Top", articles: [art("Alpha model ships", "https://x.test/a", { sourceLabel: "TLDR AI" })] }] },
  { name: "AI", sections: [{ title: "TLDR AI", articles: [art("Beta agents", "https://x.test/b"), art("Gamma chips", "https://x.test/c")] }] },
  { name: "World News", sections: [{ title: "BBC World", articles: [art("Delta summit", "https://x.test/d", { image: "https://img.test/d.jpg", sourceLabel: "BBC World" })] }] },
];

// Loads `html` at a fake URL, seeds localStorage, then runs the page script the
// way the browser would (after parsing, like <script defer>).
function load(html, { url = "https://site.test/tldr-digest/20-october-2026.html", storage = {}, fetch } = {}) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);
  if (fetch) window.fetch = fetch;
  else window.fetch = () => Promise.reject(new Error("offline"));
  window.eval(SCRIPT);
  return window;
}

const flush = () => new Promise((r) => setTimeout(r, 20));
const visibleHeadlines = (w) =>
  [...w.document.querySelectorAll(".card[data-url]")].filter((c) => !c.hidden).map((c) => c.dataset.headline);

test("day page: browse view shows Featured + topic tiles, a pill shows one topic", () => {
  const w = load(buildDailyHtml("2026-10-20", EDITIONS));
  const shown = () => [...w.document.querySelectorAll("section[id]")].filter((s) => !s.hidden).map((s) => s.id);
  assert.deepEqual(shown(), ["featured"]);
  assert.equal(w.document.getElementById("category-grid").hidden, false);
  w.document.querySelector('.quicknav a[data-target="world-news"]').click();
  assert.deepEqual(shown(), ["world-news"]);
  assert.equal(w.document.getElementById("category-grid").hidden, true);
});

test("day page: search filters across topics and links to search-every-day", () => {
  const w = load(buildDailyHtml("2026-10-20", EDITIONS));
  const box = w.document.getElementById("search-input");
  box.value = "gamma";
  box.dispatchEvent(new w.Event("input"));
  assert.deepEqual(visibleHeadlines(w), ["Gamma chips"]);
  const count = w.document.getElementById("search-count");
  assert.match(count.textContent, /^1 matching article today/);
  assert.equal(count.querySelector("a").getAttribute("href"), "search.html?q=gamma");
  box.value = "";
  box.dispatchEvent(new w.Event("input"));
  assert.equal(visibleHeadlines(w).length, 4);
});

test("day page: ?q= from search-every-day prefills and applies the search", () => {
  const w = load(buildDailyHtml("2026-10-20", EDITIONS), { url: "https://site.test/tldr-digest/20-october-2026.html?q=delta" });
  assert.equal(w.document.getElementById("search-input").value, "delta");
  assert.deepEqual(visibleHeadlines(w), ["Delta summit"]);
});

test("day page: ☆ saves a story with its date and source, without opening the card", () => {
  const w = load(buildDailyHtml("2026-10-20", EDITIONS));
  const card = w.document.querySelector('.card[data-url="https://x.test/d"]');
  const btn = card.querySelector(".save");
  btn.click();
  assert.equal(btn.getAttribute("aria-pressed"), "true");
  assert.equal(card.querySelector("details").open, false);
  const saved = JSON.parse(w.localStorage.getItem("tldr-saved"));
  assert.deepEqual(
    { h: saved["https://x.test/d"].h, s: saved["https://x.test/d"].s, d: saved["https://x.test/d"].d, i: saved["https://x.test/d"].i },
    { h: "Delta summit", s: "BBC World", d: "2026-10-20", i: "https://img.test/d.jpg" }
  );
  assert.equal(w.document.querySelector("[data-saved-count]").textContent, "1");
  btn.click();
  assert.equal(JSON.parse(w.localStorage.getItem("tldr-saved"))["https://x.test/d"], undefined);
});

test("day page: opening a card marks it read, and that persists", () => {
  const html = buildDailyHtml("2026-10-20", EDITIONS);
  const w = load(html);
  const details = w.document.querySelector('.card[data-url="https://x.test/b"] details');
  details.open = true;
  details.dispatchEvent(new w.Event("toggle"));
  const again = load(html, { storage: { "tldr-read-urls": w.localStorage.getItem("tldr-read-urls") } });
  assert.ok(again.document.querySelector('.card[data-url="https://x.test/b"]').classList.contains("is-read"));
});

test("day page: 'Show new only' toggles and is remembered", () => {
  const w = load(buildDailyHtml("2026-10-20", EDITIONS, { previousUrls: new Set(["https://x.test/b"]) }));
  const btn = w.document.getElementById("new-only");
  assert.ok(btn, "button appears when there are repeats");
  btn.click();
  assert.ok(w.document.documentElement.hasAttribute("data-newonly"));
  assert.equal(w.localStorage.getItem("tldr-new-only"), "1");
  assert.equal(btn.getAttribute("aria-pressed"), "true");
});

test("day page: a cover image that fails to load becomes a placeholder", () => {
  const w = load(buildDailyHtml("2026-10-20", EDITIONS));
  const img = w.document.querySelector("img.cover");
  img.dispatchEvent(new w.Event("error"));
  assert.equal(w.document.querySelector("img.cover"), null);
  assert.ok(w.document.querySelector('.card[data-url="https://x.test/d"] .cover.placeholder'));
});

test("day page: prev/next links come from days.json", async () => {
  const days = [
    { date: "2026-10-21", slug: "21-october-2026" },
    { date: "2026-10-20", slug: "20-october-2026" },
    { date: "2026-10-19", slug: "19-october-2026" },
  ];
  const w = load(buildDailyHtml("2026-10-20", EDITIONS), { fetch: () => Promise.resolve({ json: () => days }) });
  await flush();
  const older = w.document.querySelector(".daynav .older");
  const newer = w.document.querySelector(".daynav .newer");
  assert.deepEqual([older.hidden, older.getAttribute("href"), older.textContent], [false, "19-october-2026.html", "← 19 Oct"]);
  assert.deepEqual([newer.hidden, newer.getAttribute("href"), newer.textContent], [false, "21-october-2026.html", "21 Oct →"]);
});

test("archive: unread days since your first visit are highlighted, visited dimmed", () => {
  const manifest = ["2026-10-20", "2026-10-19", "2026-10-18", "2026-10-17"].map((date) => ({
    date, slug: date, count: 1, topics: 1, top: ["x"], image: null,
  }));
  const w = load(buildIndexHtml(manifest), {
    url: "https://site.test/tldr-digest/",
    storage: { "tldr-visited-days": JSON.stringify({ "2026-10-18": 1 }) },
  });
  const cls = [...w.document.querySelectorAll(".day-row")].map((r) => [r.dataset.date, r.classList.contains("unread"), r.classList.contains("visited")]);
  assert.deepEqual(cls, [
    ["2026-10-20", true, false],
    ["2026-10-19", true, false],
    ["2026-10-18", false, true],
    ["2026-10-17", false, false],
  ]);
});

test("saved page lists saved stories newest first and can remove them", () => {
  const saved = {
    "https://x.test/1": { u: "https://x.test/1", h: "Older", s: "DW", d: "2026-10-19", i: "", t: 1 },
    "https://x.test/2": { u: "https://x.test/2", h: "Newer", s: "BBC", d: "2026-10-20", i: "javascript:alert(1)", t: 2 },
  };
  const w = load(buildSavedHtml(), { url: "https://site.test/tldr-digest/saved.html", storage: { "tldr-saved": JSON.stringify(saved) } });
  const titles = () => [...w.document.querySelectorAll("#saved-list .title")].map((a) => a.textContent);
  assert.deepEqual(titles(), ["Newer", "Older"]);
  assert.equal(w.document.querySelector("#saved-list img"), null, "non-http image URL is not rendered");
  assert.equal(w.document.getElementById("saved-empty").hidden, true);
  w.document.querySelector("#saved-list .remove").click();
  assert.deepEqual(titles(), ["Older"]);
  w.document.querySelector("#saved-list .remove").click();
  assert.equal(w.document.getElementById("saved-empty").hidden, false);
});

test("search page: searches every month newest first, dedupes repeats, all terms must match", async () => {
  const index = {
    "search/months.json": ["2026-10", "2026-09"],
    "search/2026-10.json": [
      ["2026-10-20", "Claude Opus 6 benchmarks", "https://x.test/o6", "TLDR AI", "AI"],
      ["2026-10-19", "Claude Opus 6 benchmarks", "https://x.test/o6", "TLDR AI", "AI"],
      ["2026-10-19", "Claude Haiku news", "https://x.test/h", "TLDR AI", "AI"],
    ],
    "search/2026-09.json": [["2026-09-24", "Opus 5.5 for Claude", "https://x.test/o55", "Hacker News", "Developer Community"]],
  };
  const fetch = (u) => (u in index ? Promise.resolve({ json: () => index[u] }) : Promise.reject(new Error(u)));
  const w = load(buildSearchHtml(), { url: "https://site.test/tldr-digest/search.html?q=claude%20opus", fetch });
  for (let i = 0; i < 10; i++) await flush();
  const rows = [...w.document.querySelectorAll("#all-results .result")].map((li) => [
    li.querySelector(".title").textContent,
    li.querySelector(".meta a").getAttribute("href"),
  ]);
  assert.deepEqual(rows, [
    ["Claude Opus 6 benchmarks", "20-october-2026.html?q=claude%20opus"],
    ["Opus 5.5 for Claude", "24-september-2026.html?q=claude%20opus"],
  ]);
  assert.equal(w.document.getElementById("all-status").textContent, "2 matches");
});

test("day page: expanding a card adds a Copy link button that copies the article URL", async () => {
  const w = load(buildDailyHtml("2026-10-20", EDITIONS));
  let copied = null;
  Object.defineProperty(w.navigator, "clipboard", { value: { writeText: (t) => { copied = t; return Promise.resolve(); } } });
  const details = w.document.querySelector('.card[data-url="https://x.test/c"] details');
  details.open = true;
  details.dispatchEvent(new w.Event("toggle"));
  details.dispatchEvent(new w.Event("toggle"));
  const buttons = details.querySelectorAll(".share");
  assert.equal(buttons.length, 1, "added once");
  assert.equal(buttons[0].textContent, "Copy link");
  buttons[0].click();
  await flush();
  assert.equal(copied, "https://x.test/c");
  assert.equal(buttons[0].textContent, "Copied ✓");
});

test("day page: muted words hide matching stories and are remembered", () => {
  const html = buildDailyHtml("2026-10-20", EDITIONS);
  const w = load(html);
  const input = w.document.getElementById("mute-input");
  input.value = "gamma, BBC";
  input.dispatchEvent(new w.Event("input"));
  const muted = [...w.document.querySelectorAll(".card.is-muted")].map((c) => c.dataset.headline);
  assert.deepEqual(muted, ["Gamma chips", "Delta summit"], "matches headline or source, case-insensitive");
  assert.equal(w.document.getElementById("mute-status").textContent, "(2 hidden today)");
  const again = load(html, { storage: { "tldr-muted": w.localStorage.getItem("tldr-muted") } });
  assert.equal(again.document.querySelectorAll(".card.is-muted").length, 2);
  assert.equal(again.document.getElementById("mute-input").value, "gamma, BBC");
  input.value = "";
  input.dispatchEvent(new w.Event("input"));
  assert.equal(w.document.querySelectorAll(".card.is-muted").length, 0);
  assert.equal(w.localStorage.getItem("tldr-muted"), null);
});
