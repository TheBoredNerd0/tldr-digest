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

module.exports = { fetchEdition, parseEdition };
