const cheerio = require("cheerio");

// GitHub's own public trending page — no API key, no auth, no scraping-hostile SPA.
// This is the realistic version of "catch it when someone builds something great":
// X/Facebook/Instagram are all locked down against unauthenticated scraping (paid
// API tiers or app-review-gated access only), but a viral new open-source AI tool
// shows up here directly, straight from the source.
async function fetchGitHubTrending(limit = 12) {
  const res = await fetch("https://github.com/trending?since=daily", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`github trending: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const articles = [];
  $("article.Box-row")
    .slice(0, limit)
    .each((_, el) => {
      const row = $(el);
      const repoPath = row.find("h2.h3 a").attr("href");
      if (!repoPath) return;
      const desc = row.find("p").first().text().trim();
      const stars = row.find('a[href$="/stargazers"]').first().text().trim().replace(/,/g, "");
      const lang = row.find('[itemprop="programmingLanguage"]').first().text().trim();
      const meta = [lang, stars ? `⭐ ${stars}` : null].filter(Boolean).join(" · ");

      articles.push({
        headline: repoPath.replace(/^\//, ""),
        url: `https://github.com${repoPath}`,
        readTime: meta || null,
        blurb: desc,
      });
    });

  return { name: "GitHub Trending", sections: [{ title: "Trending Today", articles }] };
}

module.exports = { fetchGitHubTrending };
