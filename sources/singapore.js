const { fetchRssSource } = require("./rss");

// Official public RSS feeds, same pattern as sources/worldnews.js.
const SINGAPORE_FEEDS = [
  { name: "Straits Times", url: "https://www.straitstimes.com/news/singapore/rss.xml" },
  { name: "Mothership", url: "https://mothership.sg/feed/" },
];

async function fetchAllSingaporeNews(limitPerFeed = 12) {
  const results = [];
  for (const feed of SINGAPORE_FEEDS) {
    try {
      const data = await fetchRssSource({ ...feed, limit: limitPerFeed });
      if (data.sections[0].articles.length > 0) results.push(data);
    } catch (err) {
      console.error(`[${feed.name}] fetch failed: ${err.message}`);
    }
  }
  return results;
}

module.exports = { fetchAllSingaporeNews, SINGAPORE_FEEDS };
