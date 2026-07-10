const cheerio = require("cheerio");

// BBC's public World News RSS feed — official syndication feed (not a scrape), and
// unlike every other source here it carries its own image (media:thumbnail) and
// description inline, so no extra per-article fetch is needed at all.
async function fetchWorldNews(limit = 15) {
  const res = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`world news RSS: HTTP ${res.status}`);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const articles = [];
  $("item")
    .slice(0, limit)
    .each((_, el) => {
      const item = $(el);
      const headline = item.find("title").first().text().trim();
      const url = item.find("link").first().text().trim().split("?")[0];
      const blurb = item.find("description").first().text().trim();
      const rawImage = item.find("media\\:thumbnail").attr("url") || null;
      // BBC's ichef CDN serves multiple sizes off the same path; upgrade the tiny
      // default RSS thumbnail (240px) to something that won't look blurry in a card.
      const image = rawImage ? rawImage.replace("/standard/240/", "/standard/976/") : null;
      if (!headline || !url) return;
      articles.push({ headline, url, readTime: null, blurb, image });
    });

  return { name: "World News", sections: [{ title: "Top Stories", articles }] };
}

module.exports = { fetchWorldNews };
