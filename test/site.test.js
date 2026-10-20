const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { writeDayData, readDayData, listDays, summarizeDay, buildSearchIndex, writeSiteFiles, renderDay } = require("../site");
const { parseDayHtml } = require("../scripts/backfill");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tldr-site-"));
}

const day = (headline, extra = {}) => [
  { name: "Featured", sections: [{ title: "Today's Top Stories", articles: [{ headline, url: `https://e.x/${headline}`, sourceLabel: "TLDR AI", image: "https://e.x/i.jpg", ...extra }] }] },
  { name: "World News", sections: [{ title: "BBC World", articles: [{ headline: `${headline} world`, url: `https://e.x/${headline}/w`, sourceLabel: "BBC World" }] }] },
];

test("listDays sorts by real date, newest first (regression: archive order)", () => {
  const dir = tmp();
  for (const d of ["2026-07-31", "2026-10-20", "2026-08-31", "2026-09-30", "2026-10-01"]) writeDayData(d, [], dir);
  fs.writeFileSync(path.join(dir, "notes.txt"), "ignored");
  assert.deepEqual(listDays(dir), ["2026-10-20", "2026-10-01", "2026-09-30", "2026-08-31", "2026-07-31"]);
});

test("listDays on a missing directory is empty, not a crash", () => {
  assert.deepEqual(listDays(path.join(tmp(), "nope")), []);
});

test("writeDayData rejects anything that isn't an ISO date (no path tricks)", () => {
  assert.throws(() => writeDayData("../evil", [], tmp()));
});

test("day data round-trips", () => {
  const dir = tmp();
  writeDayData("2026-10-20", day("A"), dir);
  assert.deepEqual(readDayData("2026-10-20", dir), { date: "2026-10-20", editions: day("A") });
});

test("summarizeDay leads with Featured and counts every article", () => {
  const s = summarizeDay("2026-10-20", day("A"));
  assert.deepEqual(s, {
    date: "2026-10-20",
    slug: "20-october-2026",
    count: 2,
    topics: 1,
    top: ["A", "A world"],
    image: "https://e.x/i.jpg",
  });
});

test("summarizeDay prefers stories that are new since the previous day", () => {
  const editions = day("A");
  const s = summarizeDay("2026-10-20", editions, new Set(["https://e.x/A"]));
  assert.deepEqual(s.top, ["A world", "A"], "fresh story first, repeat only as filler");
});

test("buildSearchIndex splits rows by month", () => {
  const idx = buildSearchIndex([
    { date: "2026-10-20", editions: day("A") },
    { date: "2026-09-30", editions: day("B") },
  ]);
  assert.deepEqual(Object.keys(idx).sort(), ["2026-09", "2026-10"]);
  assert.deepEqual(idx["2026-10"][0], ["2026-10-20", "A", "https://e.x/A", "TLDR AI", "Featured"]);
  assert.equal(idx["2026-10"][1][3], "BBC World");
});

test("writeSiteFiles + renderDay produce a coherent site", () => {
  const dataDir = tmp();
  const siteDir = tmp();
  writeDayData("2026-07-31", day("Old"), dataDir);
  writeDayData("2026-10-20", day("New"), dataDir);
  renderDay("2026-10-20", { dataDir, siteDir, siteUrl: "https://x.test" });
  const manifest = writeSiteFiles({ dataDir, siteDir, siteUrl: "https://x.test" });

  assert.deepEqual(manifest.map((d) => d.date), ["2026-10-20", "2026-07-31"]);
  for (const f of ["index.html", "days.json", "search.html", "saved.html", "feed.xml", "search/months.json", "search/2026-10.json", "20-october-2026.html"]) {
    assert.ok(fs.existsSync(path.join(siteDir, f)), `${f} should exist`);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(siteDir, "search/months.json"))), ["2026-10", "2026-07"]);
});

test("a rendered day parses back to the same data (backfill round-trip)", () => {
  const dataDir = tmp();
  const siteDir = tmp();
  const editions = [
    ...day("Round", { readTime: "2 min", blurb: "Summary & more" }),
    { name: "AI", sections: [
      { title: "TLDR AI", articles: [{ headline: "One", url: "https://e.x/1", readTime: null, blurb: "b1", image: null, sourceLabel: "TLDR AI" }] },
      { title: "OpenAI", articles: [{ headline: "Two", url: "https://e.x/2", readTime: null, blurb: "", image: "https://e.x/2.png", sourceLabel: "OpenAI" }] },
    ] },
  ];
  writeDayData("2026-10-20", editions, dataDir);
  renderDay("2026-10-20", { dataDir, siteDir });
  const parsed = parseDayHtml(fs.readFileSync(path.join(siteDir, "20-october-2026.html"), "utf8"));

  const flat = (eds) => eds.flatMap((e) => e.sections.flatMap((s) => s.articles.map((a) => [e.name, s.title, a.headline, a.url, a.sourceLabel, a.blurb || "", a.image || null])));
  assert.deepEqual(flat(parsed), flat(editions));
});
