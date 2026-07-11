const { fetchRssSource } = require("./rss");

// Official public RSS feeds. BleepingComputer blocks unauthenticated fetches
// (403), so it isn't here.
const CYBERSECURITY_FEEDS = [
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml" },
];

async function fetchAllCyberNews(limitPerFeed = 12) {
  const results = [];
  for (const feed of CYBERSECURITY_FEEDS) {
    try {
      const data = await fetchRssSource({ ...feed, limit: limitPerFeed });
      if (data.sections[0].articles.length > 0) results.push(data);
    } catch (err) {
      console.error(`[${feed.name}] fetch failed: ${err.message}`);
    }
  }
  return results;
}

module.exports = { fetchAllCyberNews, CYBERSECURITY_FEEDS };
