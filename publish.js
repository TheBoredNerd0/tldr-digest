const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileP = promisify(execFile);

const { EDITIONS } = require("./editions");
const { fetchEdition, attachImages } = require("./scrape");
const { fetchHackerNews } = require("./sources/hackernews");
const { fetchRundownAI } = require("./sources/rundown");
const { fetchAllWorldNews } = require("./sources/worldnews");
const { dateToSlug, buildDailyHtml, buildIndexHtml } = require("./html");
const { sendTelegramMessage } = require("./send");

const CHAT_ID = process.env.TLDR_DIGEST_CHAT_ID || "370423423";
const SITE_DIR = path.join(__dirname, "docs");
const SITE_URL_BASE =
  process.env.TLDR_DIGEST_SITE_URL || "https://theborednerd0.github.io/tldr-digest";

async function run() {
  const editions = [];
  let isoDate = null;

  for (const edition of EDITIONS) {
    try {
      const data = await fetchEdition(edition.slug);
      if (data.sections.length === 0) continue; // e.g. "hardware" not launched yet
      if (!isoDate) isoDate = data.date;
      editions.push({ name: `TLDR ${edition.name}`, sections: data.sections });
    } catch (err) {
      console.error(`[${edition.slug}] fetch failed: ${err.message}`);
    }
  }

  if (!isoDate) throw new Error("Could not determine today's date from any edition — aborting.");

  // Non-TLDR single-edition sources: kept separate from the TLDR fetch loop above
  // since they don't share its slug/error shape, but merge into the same
  // {name, sections} structure.
  const extraSources = [
    { label: "hackernews", fn: () => fetchHackerNews(15) },
    { label: "rundown", fn: () => fetchRundownAI(8) },
  ];
  for (const { label, fn } of extraSources) {
    try {
      const data = await fn();
      if (data.sections.some((s) => s.articles.length > 0)) editions.push(data);
    } catch (err) {
      console.error(`[${label}] fetch failed: ${err.message}`);
    }
  }

  // World news is several outlets at once (each already error-isolated internally),
  // one edition per outlet so provenance stays visible per card.
  const worldNewsEditions = await fetchAllWorldNews(12);
  editions.push(...worldNewsEditions);

  const featured = buildFeatured(editions);
  if (featured.sections[0].articles.length > 0) editions.unshift(featured);

  const deduped = dedupeAcrossEditions(editions);

  console.log(`Fetching cover images for ${deduped.reduce((n, e) => n + e.sections.reduce((m, s) => m + s.articles.length, 0), 0)} articles...`);
  await attachImages(deduped);

  const slug = dateToSlug(isoDate);
  const html = buildDailyHtml(isoDate, deduped);
  fs.mkdirSync(SITE_DIR, { recursive: true });
  fs.writeFileSync(path.join(SITE_DIR, `${slug}.html`), html);

  const existing = fs
    .readdirSync(SITE_DIR)
    .filter((f) => /^\d{2}-[a-z]+-\d{4}\.html$/.test(f))
    .map((f) => f.replace(/\.html$/, ""));
  const days = [...new Set([slug, ...existing])]
    .sort()
    .reverse()
    .map((s) => ({ slug: s, isoDate: slugToIso(s) }));
  fs.writeFileSync(path.join(SITE_DIR, "index.html"), buildIndexHtml(days));

  await execFileP("git", ["add", "docs/"], { cwd: __dirname });
  const commitResult = await execFileP(
    "git",
    ["commit", "-m", `Publish digest for ${isoDate}`],
    { cwd: __dirname }
  ).catch((e) => e); // no-op if nothing changed (e.g. re-run same day)
  await execFileP("git", ["push", "origin", "HEAD"], { cwd: __dirname });

  const pageUrl = `${SITE_URL_BASE}/${slug}.html`;
  console.log(`Published ${pageUrl}`);

  const editionCount = deduped.length;
  const articleCount = deduped.reduce(
    (n, e) => n + e.sections.reduce((m, s) => m + s.articles.length, 0),
    0
  );
  await sendTelegramMessage(
    CHAT_ID,
    `📰 *TLDR Digest — ${escapeMdV2(isoDate)}*\n${escapeMdV2(
      `${editionCount} editions, ${articleCount} articles`
    )}\n${escapeMdV2(pageUrl)}`
  );
}

// Pulls a curated "front page" from across every source: the day's biggest world
// events, the highest-engagement Hacker News stories, and each flagship TLDR
// edition's own lead pick. Runs before dedupeAcrossEditions and gets unshifted to
// the front of the editions list, so anything picked here is simply not repeated
// further down the page (same first-occurrence-wins rule as everything else).
function buildFeatured(editions) {
  const byName = (name) => editions.find((e) => e.name === name);
  // Tag each pick with its true origin so the card badge still shows "World News" /
  // "Hacker News" etc. instead of just "Featured" once it's moved to the front.
  const firstArticles = (edition, n) =>
    edition
      ? edition.sections
          .flatMap((s) => s.articles)
          .slice(0, n)
          .map((a) => ({ ...a, sourceLabel: edition.name }))
      : [];

  const picks = [
    ...firstArticles(byName("BBC World"), 2),
    ...firstArticles(byName("Guardian World"), 1),
    ...firstArticles(byName("Al Jazeera"), 1),
    ...firstArticles(byName("Hacker News"), 3),
    ...firstArticles(byName("TLDR Tech"), 1),
    ...firstArticles(byName("TLDR AI"), 1),
    ...firstArticles(byName("The Rundown AI"), 1),
  ];

  return { name: "Featured", sections: [{ title: "Today's Top Stories", articles: picks }] };
}

// TLDR intentionally cross-posts big stories to multiple editions (e.g. a major AI
// launch shows up in both Tech and AI the same day), which reads as repeats once
// every edition is stacked on one page. Keep only the first occurrence of a given
// article URL, in edition order, and drop any section/edition left empty after that.
function dedupeAcrossEditions(editions) {
  const seen = new Set();
  return editions
    .map((edition) => ({
      name: edition.name,
      sections: edition.sections
        .map((section) => ({
          title: section.title,
          articles: section.articles.filter((a) => {
            if (seen.has(a.url)) return false;
            seen.add(a.url);
            return true;
          }),
        }))
        .filter((section) => section.articles.length > 0),
    }))
    .filter((edition) => edition.sections.length > 0);
}

function slugToIso(slug) {
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const [d, mName, y] = slug.split("-");
  const m = String(months.indexOf(mName) + 1).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function escapeMdV2(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (ch) => `\\${ch}`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
