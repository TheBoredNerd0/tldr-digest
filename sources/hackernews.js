// Official HN API — no HTML scraping needed, structured JSON, very unlikely to break.
const API = "https://hacker-news.firebaseio.com/v0";

async function fetchHackerNews(limit = 15) {
  const ids = await fetch(`${API}/topstories.json`).then((r) => r.json());
  const items = await Promise.all(
    ids.slice(0, limit).map((id) => fetch(`${API}/item/${id}.json`).then((r) => r.json()))
  );

  const articles = items
    .filter((item) => item && item.type === "story" && item.title)
    .map((item) => ({
      headline: item.title,
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      readTime: null,
      blurb: `${item.score ?? 0} points, ${item.descendants ?? 0} comments on Hacker News`,
    }));

  return { name: "Hacker News", sections: [{ title: "Top Stories", articles }] };
}

module.exports = { fetchHackerNews };
