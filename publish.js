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
const { fetchAllSingaporeNews } = require("./sources/singapore");
const { fetchGitHubTrending } = require("./sources/github");
const { fetchAllCyberNews } = require("./sources/cybersecurity");
const { fetchAllAiBlogs } = require("./sources/aiblogs");
const { dateToSlug, buildDailyHtml, buildIndexHtml } = require("./html");
const { sendTelegramMessage } = require("./send");

// Sorts tiles by topic instead of by publisher — confirmed with the user before
// building, since this is an editorial call with no single objectively-correct
// answer (e.g. Crypto could reasonably sit under either Business or Tech).
const TOPIC_GROUPS = [
  { name: "AI", members: ["TLDR AI", "The Rundown AI"] },
  { name: "Tech & Startups", members: ["TLDR Tech", "TLDR Founders", "TLDR Product"] },
  { name: "Programming & Data", members: ["TLDR Dev", "TLDR DevOps", "TLDR Data", "TLDR Design"] },
  { name: "Business & Finance", members: ["TLDR Marketing", "TLDR Fintech", "TLDR Crypto"] },
  { name: "Security & IT", members: ["TLDR Infosec", "TLDR IT"] },
  { name: "Developer Community", members: ["Hacker News", "GitHub Trending"] },
];

const CHAT_ID = process.env.TLDR_DIGEST_CHAT_ID || "370423423";
const SITE_DIR = path.join(__dirname, "docs");
const SITE_URL_BASE =
  process.env.TLDR_DIGEST_SITE_URL || "https://theborednerd0.github.io/tldr-digest";

// The digest's date is *today, in Singapore*, not whatever date TLDR's own feed
// happens to self-report. TLDR was previously the sole source of `isoDate`, so
// when their publish cadence lagged (their "latest" stayed on the same date for
// several days in a row), this site's filename lagged right along with it —
// silently overwriting each prior day's file under the same stale name, even
// though the other 29 sources were always current. This is a snapshot of what's
// out there *right now*, dated by when it was collected, independent of any one
// source's own publish timestamp.
function todayInSingapore() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

async function run() {
  const editions = [];
  const isoDate = todayInSingapore();

  for (const edition of EDITIONS) {
    try {
      const data = await fetchEdition(edition.slug);
      if (data.sections.length === 0) continue; // e.g. "hardware" not launched yet
      editions.push({ name: `TLDR ${edition.name}`, sections: data.sections });
    } catch (err) {
      console.error(`[${edition.slug}] fetch failed: ${err.message}`);
    }
  }

  // Non-TLDR single-edition sources: kept separate from the TLDR fetch loop above
  // since they don't share its slug/error shape, but merge into the same
  // {name, sections} structure.
  const extraSources = [
    { label: "hackernews", fn: () => fetchHackerNews(15) },
    { label: "rundown", fn: () => fetchRundownAI(8) },
    { label: "github", fn: () => fetchGitHubTrending(12) },
  ];
  for (const { label, fn } of extraSources) {
    try {
      const data = await fn();
      if (data.sections.some((s) => s.articles.length > 0)) editions.push(data);
    } catch (err) {
      console.error(`[${label}] fetch failed: ${err.message}`);
    }
  }

  // World and Singapore news are each several outlets at once (already
  // error-isolated internally), same for the cybersecurity and AI-blog additions.
  const worldNewsEditions = await fetchAllWorldNews(12);
  const singaporeEditions = await fetchAllSingaporeNews(12);
  const cyberEditions = await fetchAllCyberNews(12);
  const aiBlogEditions = await fetchAllAiBlogs(10);

  // Featured picks are computed against every individual raw source (so e.g. "BBC
  // World" vs "Guardian World" stays distinguishable there), *before* any topic
  // grouping below — grouping is purely a browse-view concern for the main body.
  const featured = buildFeatured([
    ...editions,
    ...worldNewsEditions,
    ...singaporeEditions,
    ...cyberEditions,
    ...aiBlogEditions,
  ]);

  // Requested: sort tiles by topic, not by which company/outlet publishes them.
  // TLDR/HN/Rundown/GitHub Trending get regrouped into topic clusters; some
  // groups also pull in raw RSS outlets fetched above (e.g. Krebs on Security
  // folds into "Security & IT" alongside TLDR Infosec/IT, not a separate tile).
  const TOPIC_EXTRAS = { AI: aiBlogEditions, "Security & IT": cyberEditions };
  const groupedCore = TOPIC_GROUPS.map((group) => {
    const named = group.members.map((name) => editions.find((e) => e.name === name)).filter(Boolean);
    const extra = TOPIC_EXTRAS[group.name] || [];
    return mergeEditions([...named, ...extra], group.name);
  }).filter((group) => group.sections.length > 0);

  const finalEditions = [
    ...(featured.sections[0].articles.length > 0 ? [featured] : []),
    ...groupedCore,
    mergeEditions(worldNewsEditions, "World News"),
    mergeEditions(singaporeEditions, "Singapore News"),
  ];

  const deduped = dedupeAcrossEditions(finalEditions);

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

// Pulls a curated "front page" from across every source. Re-focused 2026-07-15 on
// request ("news that matters more to me are about AI... which new AI model that
// is news, and also the github repo") — Featured is now AI model/lab news plus
// GitHub Trending repos, not a general world-news front page. Runs before
// dedupeAcrossEditions and gets unshifted to the front of the editions list, so
// anything picked here is simply not repeated further down the page (same
// first-occurrence-wins rule as everything else).
function buildFeatured(editions) {
  const byName = (name) => editions.find((e) => e.name === name);
  // Tag each pick with its true origin so the card badge still shows "OpenAI" /
  // "GitHub Trending" etc. instead of just "Featured" once it's moved to the front.
  const firstArticles = (edition, n) =>
    edition
      ? edition.sections
          .flatMap((s) => s.articles)
          .slice(0, n)
          .map((a) => ({ ...a, sourceLabel: edition.name }))
      : [];

  const picks = [
    ...firstArticles(byName("TLDR AI"), 3),
    ...firstArticles(byName("The Rundown AI"), 2),
    ...firstArticles(byName("OpenAI"), 2),
    ...firstArticles(byName("Google DeepMind"), 1),
    ...firstArticles(byName("Google Research"), 1),
    ...firstArticles(byName("Hugging Face"), 1),
    ...firstArticles(byName("TechCrunch AI"), 1),
    ...firstArticles(byName("VentureBeat AI"), 1),
    ...firstArticles(byName("GitHub Trending"), 4),
  ];

  return { name: "Featured", sections: [{ title: "Today's Top Stories", articles: picks }] };
}

// Combines several same-topic outlet editions (e.g. 5 world-news feeds) into one
// browsable edition, keyed by the group name, while each article keeps its own
// outlet as its card badge (via sourceLabel) — so "World News" is one tile/tab to
// navigate, but a card still reads "🌍 BBC World" or "🇬🇧 Guardian World", not just
// "World News". Each outlet becomes its own titled sub-section within the group,
// same pattern a single TLDR edition already uses for its own sections.
function mergeEditions(editionsToMerge, groupName) {
  const sections = editionsToMerge
    .map((edition) => ({
      title: edition.name,
      articles: edition.sections
        .flatMap((s) => s.articles)
        .map((a) => ({ ...a, sourceLabel: a.sourceLabel || edition.name })),
    }))
    .filter((section) => section.articles.length > 0);
  return { name: groupName, sections };
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
