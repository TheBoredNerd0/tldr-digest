const { fetchRssSource } = require("./rss");

// Official public RSS feeds. Anthropic's news page has no RSS at all (confirmed
// 404), so it isn't here — would need a different approach (e.g. scraping their
// news page directly) if that specific source matters enough to revisit.
// OpenAI's and Hugging Face's feeds are large full archives, not just recent
// posts — relying on `limit` (RSS order is newest-first) to keep this to
// current items rather than pulling their whole history.
const AI_BLOG_FEEDS = [
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { name: "Google Research", url: "https://research.google/blog/rss/" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
];

async function fetchAllAiBlogs(limitPerFeed = 10) {
  const results = [];
  for (const feed of AI_BLOG_FEEDS) {
    try {
      const data = await fetchRssSource({ ...feed, limit: limitPerFeed });
      if (data.sections[0].articles.length > 0) results.push(data);
    } catch (err) {
      console.error(`[${feed.name}] fetch failed: ${err.message}`);
    }
  }
  return results;
}

module.exports = { fetchAllAiBlogs, AI_BLOG_FEEDS };
