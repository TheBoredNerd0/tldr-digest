const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileP = promisify(execFile);

const { EDITIONS } = require("./editions");
const { fetchEdition } = require("./scrape");
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
      editions.push({ name: edition.name, sections: data.sections });
    } catch (err) {
      console.error(`[${edition.slug}] fetch failed: ${err.message}`);
    }
  }

  if (!isoDate) throw new Error("Could not determine today's date from any edition — aborting.");

  const slug = dateToSlug(isoDate);
  const html = buildDailyHtml(isoDate, editions);
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

  const editionCount = editions.length;
  const articleCount = editions.reduce(
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
