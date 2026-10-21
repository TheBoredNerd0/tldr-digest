// One-off: recover data/days/<date>.json for days published before data/ existed,
// by parsing each docs/<DD-month-YYYY>.html back into { name, sections } editions.
// Handles both card formats the site has used: the current one (data-url /
// data-headline / data-source attributes, headline in .overlay) and the very first
// one (09 July: headline in <summary>, link only in the "Read more" anchor).
//
//   node scripts/backfill.js          # skips days that already have data
//   node scripts/backfill.js --force  # re-parses every page
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { slugToIso } = require("../html");
const { DATA_DIR, SITE_DIR, dayDataPath, writeDayData } = require("../site");

const DAY_FILE = /^\d{2}-[a-z]+-\d{4}\.html$/;

// "🤖 TLDR AI" -> "TLDR AI": strip the leading emoji badge (any run of non-letter,
// non-digit characters, which also covers flag pairs and ZWJ sequences).
function stripBadge(text) {
  return String(text).replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function parseCard($, card) {
  const $card = $(card);
  const more = $card.find(".blurb a").last();
  const url = $card.attr("data-url") || more.attr("href");
  let headline = $card.attr("data-headline") || $card.find(".overlay .headline").first().text();
  if (!headline) {
    const summary = $card.find("summary").first().clone();
    summary.find(".readtime").remove();
    headline = summary.text();
  }
  headline = headline.replace(/\s+/g, " ").trim();
  if (!url || !headline) return null;

  let blurb = $card.attr("data-blurb");
  if (blurb == null) {
    const p = $card.find(".blurb").first().clone();
    p.find("a").last().remove(); // the "Read more →" link
    blurb = p.text();
  }
  const source = $card.attr("data-source") || stripBadge($card.find(".source").first().text());
  const readTime = $card.find(".readtime").first().text().trim() || null;
  const image = $card.find("img.cover").attr("src") || null;
  return { headline, url, readTime, blurb: blurb.replace(/\s+/g, " ").trim(), image, sourceLabel: source || undefined };
}

function parseDayHtml(html) {
  const $ = cheerio.load(html);
  const editions = [];
  $("section[id]").each((_, sectionEl) => {
    const $section = $(sectionEl);
    const heading = $section.find("summary.edition").first().clone();
    heading.find(".count").remove();
    const name = stripBadge(heading.text() || $section.find("h2.edition").first().text());
    if (!name) return;

    const sections = [];
    let current = null;
    // h3.section starts a sub-section; every .card after it belongs to it until
    // the next h3. Featured has no h3s, so it gets one implicit section.
    $section.find("h3.section, .card").each((__, el) => {
      if ($(el).is("h3.section")) {
        current = { title: $(el).text().trim(), articles: [] };
        sections.push(current);
        return;
      }
      if (!current) {
        current = { title: name === "Featured" ? "Today's Top Stories" : name, articles: [] };
        sections.push(current);
      }
      const article = parseCard($, el);
      if (article) {
        // A card whose badge just repeats the edition name carried no extra
        // source info; drop it so re-rendering matches the original.
        if (article.sourceLabel === name) delete article.sourceLabel;
        current.articles.push(article);
      }
    });
    const nonEmpty = sections.filter((s) => s.articles.length > 0);
    if (nonEmpty.length) editions.push({ name, sections: nonEmpty });
  });
  return editions;
}

function backfill({ siteDir = SITE_DIR, dataDir = DATA_DIR, force = false } = {}) {
  const results = [];
  for (const file of fs.readdirSync(siteDir).filter((f) => DAY_FILE.test(f))) {
    const isoDate = slugToIso(file.replace(/\.html$/, ""));
    if (!force && fs.existsSync(dayDataPath(isoDate, dataDir))) continue;
    const editions = parseDayHtml(fs.readFileSync(path.join(siteDir, file), "utf8"));
    writeDayData(isoDate, editions, dataDir);
    const count = editions.reduce((n, e) => n + e.sections.reduce((m, s) => m + s.articles.length, 0), 0);
    results.push({ isoDate, editions: editions.length, count });
  }
  return results;
}

module.exports = { parseDayHtml, backfill, stripBadge };

if (require.main === module) {
  const results = backfill({ force: process.argv.includes("--force") });
  for (const r of results.sort((a, b) => a.isoDate.localeCompare(b.isoDate))) {
    console.log(`${r.isoDate}  ${String(r.editions).padStart(2)} editions  ${String(r.count).padStart(3)} articles`);
  }
  console.log(`backfilled ${results.length} day(s)`);
}
