const fs = require("fs");
const path = require("path");

const {
  dateToSlug,
  slugToIso,
  buildDailyHtml,
  buildIndexHtml,
  buildSearchHtml,
  buildSavedHtml,
  buildFeedXml,
  ASSETS,
} = require("./html");

// Each day's deduped editions are kept as JSON, not just as rendered HTML. Before
// this the HTML page was the only record of a day, so a template change could
// never reach old pages and nothing could search across days. data/ lives outside
// docs/ on purpose: it's the source of truth for rendering, not something the
// site serves (the browser gets the much smaller search index instead).
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data", "days");
const SITE_DIR = path.join(ROOT, "docs");
const SITE_URL_BASE =
  process.env.TLDR_DIGEST_SITE_URL || "https://theborednerd0.github.io/tldr-digest";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function dayDataPath(isoDate, dataDir = DATA_DIR) {
  if (!ISO_RE.test(isoDate)) throw new Error(`bad date: ${isoDate}`);
  return path.join(dataDir, `${isoDate}.json`);
}

// meta: optional extras stored alongside the editions, e.g. { missingSources }.
function writeDayData(isoDate, editions, meta = {}, dataDir = DATA_DIR) {
  if (typeof meta === "string") [meta, dataDir] = [{}, meta]; // (date, editions, dataDir)
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dayDataPath(isoDate, dataDir), JSON.stringify({ date: isoDate, editions, ...meta }));
}

function readDayData(isoDate, dataDir = DATA_DIR) {
  return JSON.parse(fs.readFileSync(dayDataPath(isoDate, dataDir), "utf8"));
}

// Every day we know about, newest first. Sorted on the ISO date, never on the
// "DD-month-YYYY" filename: sorting those strings is what put 31 July above
// 20 October on the old archive page.
function listDays(dataDir = DATA_DIR) {
  let files = [];
  try {
    files = fs.readdirSync(dataDir);
  } catch {
    return [];
  }
  return files
    .map((f) => f.replace(/\.json$/, ""))
    .filter((d) => ISO_RE.test(d))
    .sort()
    .reverse();
}

function allArticles(editions) {
  return editions.flatMap((e) => e.sections.flatMap((s) => s.articles.map((a) => ({ ...a, topic: e.name }))));
}

// One archive row per day: what the home page, RSS feed and prev/next links need,
// without loading every day's full data in the browser. `seenBefore` holds the
// previous day's article URLs: TLDR re-serves the same "latest" edition over
// weekends, so without it several archive rows in a row showed the same three
// headlines. Fresh stories are preferred; repeats only fill remaining slots.
function summarizeDay(isoDate, editions, seenBefore = new Set()) {
  const articles = allArticles(editions);
  const featured = editions.find((e) => e.name === "Featured");
  const pool = featured ? [...allArticles([featured]), ...articles] : articles;
  const fresh = pool.filter((a) => !seenBefore.has(a.url));
  const lead = [...new Map([...fresh, ...pool].map((a) => [a.url, a])).values()].slice(0, 3);
  const withImage = lead.find((a) => a.image) || pool.find((a) => a.image);
  return {
    date: isoDate,
    slug: dateToSlug(isoDate),
    count: articles.length,
    topics: editions.filter((e) => e.name !== "Featured").length,
    top: lead.map((a) => a.headline),
    image: withImage ? withImage.image : null,
  };
}

// Compact cross-day search index, split by month so the search page can load the
// newest month first and the rest on demand. Rows are arrays rather than objects
// (about 40% smaller): [date, headline, url, source, topic].
// days must be newest first. Each URL is indexed once, at its newest appearance:
// the search page only ever shows a story once anyway, and ~1/3 of rows were the
// same story carried over from the day before.
function buildSearchIndex(days) {
  const months = {};
  const seen = new Set();
  for (const { date, editions } of days) {
    const key = date.slice(0, 7);
    months[key] = months[key] || [];
    for (const a of allArticles(editions)) {
      if (seen.has(a.url)) continue;
      seen.add(a.url);
      months[key].push([date, a.headline, a.url, a.sourceLabel || a.topic, a.topic]);
    }
  }
  return months;
}

// Re-renders everything that spans more than one day: home/archive, days.json
// (used by each day page for prev/next), the month-split search index, the Saved
// and Search pages, and the RSS feed. Day pages themselves are only rendered by
// renderDay(), so a normal publish touches one new page rather than all 100+.
function writeSiteFiles({ dataDir = DATA_DIR, siteDir = SITE_DIR, siteUrl = SITE_URL_BASE } = {}) {
  const dates = listDays(dataDir);
  const days = dates.map((d) => ({ date: d, editions: readDayData(d, dataDir).editions }));
  // days is newest first, so the "previous day" for days[i] is days[i + 1].
  const manifest = days.map(({ date, editions }, i) => {
    const older = days[i + 1];
    const seen = new Set(older ? allArticles(older.editions).map((a) => a.url) : []);
    return summarizeDay(date, editions, seen);
  });

  fs.mkdirSync(path.join(siteDir, "search"), { recursive: true });
  fs.writeFileSync(path.join(siteDir, "days.json"), JSON.stringify(manifest));

  const index = buildSearchIndex(days);
  const months = Object.keys(index).sort().reverse();
  for (const m of months) {
    fs.writeFileSync(path.join(siteDir, "search", `${m}.json`), JSON.stringify(index[m]));
  }
  fs.writeFileSync(path.join(siteDir, "search", "months.json"), JSON.stringify(months));

  fs.writeFileSync(path.join(siteDir, "index.html"), buildIndexHtml(manifest, { siteUrl }));
  fs.writeFileSync(path.join(siteDir, "search.html"), buildSearchHtml({ siteUrl }));
  fs.writeFileSync(path.join(siteDir, "saved.html"), buildSavedHtml({ siteUrl }));
  fs.writeFileSync(path.join(siteDir, "feed.xml"), buildFeedXml(manifest.slice(0, 30), { siteUrl }));
  fs.mkdirSync(path.join(siteDir, "assets"), { recursive: true });
  for (const [file, body] of Object.entries(ASSETS)) fs.writeFileSync(path.join(siteDir, file), body);
  return manifest;
}

function renderDay(isoDate, { dataDir = DATA_DIR, siteDir = SITE_DIR, siteUrl = SITE_URL_BASE } = {}) {
  const { editions, missingSources = [] } = readDayData(isoDate, dataDir);
  // The closest earlier day we have, for marking stories it already carried.
  const previous = listDays(dataDir).find((d) => d < isoDate);
  const previousUrls = previous
    ? new Set(allArticles(readDayData(previous, dataDir).editions).map((a) => a.url))
    : null;
  const slug = dateToSlug(isoDate);
  fs.mkdirSync(siteDir, { recursive: true });
  fs.writeFileSync(path.join(siteDir, `${slug}.html`), buildDailyHtml(isoDate, editions, { siteUrl, previousUrls, missingSources }));
  return slug;
}

module.exports = {
  DATA_DIR,
  SITE_DIR,
  SITE_URL_BASE,
  dayDataPath,
  writeDayData,
  readDayData,
  listDays,
  summarizeDay,
  buildSearchIndex,
  writeSiteFiles,
  renderDay,
  slugToIso,
};
