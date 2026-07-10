const cheerio = require("cheerio");

// therundown.ai's /archive is server-rendered (beehiiv), unlike most newsletter sites
// which only render their archive client-side via JS. Each post page carries a clean
// meta description (works well as the digest blurb) and an og:image.
async function fetchRundownAI(limit = 8) {
  const archiveRes = await fetch("https://www.therundown.ai/archive", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!archiveRes.ok) throw new Error(`rundown archive: HTTP ${archiveRes.status}`);
  const archiveHtml = await archiveRes.text();
  const slugs = [...new Set([...archiveHtml.matchAll(/href="(\/p\/[a-z0-9-]+)"/g)].map((m) => m[1]))].slice(
    0,
    limit
  );

  const articles = [];
  for (const slug of slugs) {
    try {
      const url = `https://www.therundown.ai${slug}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      const headline = $("title").first().text().replace(/\s*\|\s*The Rundown AI\s*$/i, "").trim();
      const blurb = $('meta[name="description"]').attr("content") || "";
      const image = $('meta[property="og:image"]').attr("content") || null;
      if (!headline) continue;
      articles.push({ headline, url, readTime: null, blurb, image });
    } catch {
      // skip this post, not fatal for the rest
    }
  }

  return { name: "The Rundown AI", sections: [{ title: "Daily AI Briefing", articles }] };
}

module.exports = { fetchRundownAI };
