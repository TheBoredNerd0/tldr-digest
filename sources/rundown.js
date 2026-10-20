const { fetchRssSource } = require("./rss");

// therundown.ai moved off beehiiv (2026-10): the old server-rendered /archive now
// 308-redirects and its /p/<slug> post links are gone, so scraping it silently
// returned 0 articles every day. The new site publishes a proper RSS feed instead.
// Its items carry no image; attachImages() falls back to each page's og:image.
async function fetchRundownAI(limit = 8) {
  return fetchRssSource({
    name: "The Rundown AI",
    url: "https://www.therundown.ai/feed",
    sectionTitle: "Daily AI Briefing",
    limit,
  });
}

module.exports = { fetchRundownAI };
