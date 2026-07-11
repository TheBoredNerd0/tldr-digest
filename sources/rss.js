const cheerio = require("cheerio");

// Strips embedded HTML from RSS <description> text (e.g. the Guardian wraps its
// description in multiple <p> tags) down to plain text for the card blurb. Joins
// block-level children with a space — cheerio's .text() alone concatenates
// adjacent <p> tags with no separator at all.
function stripHtml(html) {
  const $ = cheerio.load(html || "");
  const blocks = $("body")
    .find("p, div, br")
    .toArray()
    .map((el) => $(el).text().trim())
    .filter(Boolean);
  return (blocks.length > 0 ? blocks.join(" ") : $("body").text().trim()).replace(/\s+/g, " ");
}

// Generic official-RSS-feed source: works for any standard RSS 2.0 feed, with
// media:content / media:thumbnail as a best-effort image (falls back to the
// generic og:image scrape in attachImages() if the feed doesn't carry one).
async function fetchRssSource({ name, url, sectionTitle = "Top Stories", limit = 15 }) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const articles = [];
  $("item")
    .slice(0, limit)
    .each((_, el) => {
      const item = $(el);
      const headline = item.find("title").first().text().trim();
      const link = item.find("link").first().text().trim().split("?")[0];
      const blurb = stripHtml(item.find("description").first().text().trim());
      let image =
        item.find("media\\:content").attr("url") ||
        item.find("media\\:thumbnail").attr("url") ||
        null;
      // BBC's RSS thumbnail is a tiny 240px default; their ichef CDN serves the
      // same image at other sizes off the same path, so upgrade it in place.
      if (image && image.includes("ichef.bbci.co.uk")) {
        image = image.replace("/standard/240/", "/standard/976/");
      }
      if (!headline || !link) return;
      articles.push({ headline, url: link, readTime: null, blurb, image });
    });

  return { name, sections: [{ title: sectionTitle, articles }] };
}

module.exports = { fetchRssSource };
