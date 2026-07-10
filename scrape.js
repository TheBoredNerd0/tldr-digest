const cheerio = require("cheerio");

// tldr.tech renders each day's edition server-side as <section> blocks: a header with
// the section title (e.g. "Big Tech & Startups"), followed by <article> blocks each
// holding one story: a linked headline (with "(N minute read)" suffix) and a blurb div.
// /api/latest/{slug} server-renders the most recent edition directly (works for every
// edition, unlike the plain landing page which only exposes dated archive links for
// some slugs). The dated URL itself isn't in a clean meta tag, but it does appear
// embedded in the page's Next.js data payload, so pull it out with a regex.
async function fetchEdition(slug) {
  const res = await fetch(`https://tldr.tech/api/latest/${slug}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) {
    throw new Error(`${slug}: HTTP ${res.status}`);
  }
  const html = await res.text();
  const dateMatch = html.match(new RegExp(`/${slug}/(\\d{4}-\\d{2}-\\d{2})`));
  const date = dateMatch ? dateMatch[1] : null;
  return parseEdition(html, date);
}

function parseEdition(html, date = null) {
  const $ = cheerio.load(html);

  const sections = [];
  $("section").each((_, sectionEl) => {
    const section = $(sectionEl);
    const sectionTitle = section.find("header h3").first().text().trim();
    if (!sectionTitle) return;

    const articles = [];
    section.find("article").each((_, articleEl) => {
      const article = $(articleEl);
      const link = article.find("a.font-bold, a").first();
      const href = link.attr("href");
      let headline = link.find("h3").first().text().trim();
      if (!headline) headline = link.text().trim();
      if (!href || !headline) return;
      if (/\(sponsor\)/i.test(headline)) return; // skip sponsor slots

      const readTimeMatch = headline.match(/\((\d+)\s*minute read\)/i);
      const readTime = readTimeMatch ? `${readTimeMatch[1]} min` : null;
      const cleanHeadline = headline.replace(/\s*\(\d+\s*minute read\)\s*$/i, "").trim();

      const blurb = article.find("div.newsletter-html").first().text().trim();

      articles.push({
        headline: cleanHeadline,
        url: href.split("?")[0],
        readTime,
        blurb,
      });
    });

    if (articles.length > 0) {
      sections.push({ title: sectionTitle, articles });
    }
  });

  return { date, sections };
}

// Best-effort cover image for an article: pull og:image / twitter:image from the
// linked page itself (tldr.tech's own markup carries no images). Many sites block
// or rate-limit scrapers, so failures are expected and just mean no image, not
// a fatal error for the whole digest.
async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    return (
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null
    );
  } catch {
    return null;
  }
}

// Runs `fn` over `items` with at most `limit` in flight at once.
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function attachImages(editions, concurrency = 10) {
  const articles = editions
    .flatMap((e) => e.sections.flatMap((s) => s.articles))
    .filter((a) => !a.image); // some sources (e.g. Rundown AI) already resolved their own image
  await mapWithConcurrency(articles, concurrency, async (a) => {
    a.image = await fetchOgImage(a.url);
  });
}

module.exports = { fetchEdition, parseEdition, fetchOgImage, attachImages };
