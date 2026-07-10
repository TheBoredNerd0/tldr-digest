const { fetchRssSource } = require("./rss");

// Official public RSS feeds only — no scraping, no API keys. Reuters' public feed
// was discontinued (404) and AP has no real RSS, so those aren't here. Each outlet
// becomes its own "edition" (own source badge) rather than one merged "World News"
// blob, same as every other source in this project, so provenance stays visible
// per card and each outlet's own editorial picks stay distinguishable.
const WORLD_NEWS_FEEDS = [
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Guardian World", url: "https://www.theguardian.com/world/rss" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NYT World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "NPR World", url: "https://feeds.npr.org/1004/rss.xml" },
];

async function fetchAllWorldNews(limitPerFeed = 12) {
  const results = [];
  for (const feed of WORLD_NEWS_FEEDS) {
    try {
      const data = await fetchRssSource({ ...feed, limit: limitPerFeed });
      if (data.sections[0].articles.length > 0) results.push(data);
    } catch (err) {
      console.error(`[${feed.name}] fetch failed: ${err.message}`);
    }
  }
  return results;
}

module.exports = { fetchAllWorldNews, WORLD_NEWS_FEEDS };
