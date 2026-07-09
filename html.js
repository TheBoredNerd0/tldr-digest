const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// "2026-07-09" -> "09-july-2026" (matches the requested filename convention)
function dateToSlug(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${MONTHS[parseInt(m, 10) - 1]}-${y}`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PAGE_STYLES = `
  :root { color-scheme: light dark; }
  body {
    margin: 0; padding: 2rem 1rem 4rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    max-width: 720px; margin-inline: auto; line-height: 1.5;
    background: #fff; color: #1a1a1a;
  }
  @media (prefers-color-scheme: dark) { body { background: #14151a; color: #e8e8ea; } }
  h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
  .date { color: #767680; margin-bottom: 2rem; font-size: 0.95rem; }
  h2.edition {
    font-size: 1.2rem; margin-top: 2.5rem; padding-bottom: 0.4rem;
    border-bottom: 2px solid #767680; text-transform: uppercase; letter-spacing: 0.03em;
  }
  h3.section { font-size: 1rem; color: #767680; margin: 1.5rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  article { margin-bottom: 1.25rem; }
  article a.headline { font-weight: 600; text-decoration: none; color: inherit; }
  article a.headline:hover { text-decoration: underline; }
  .readtime { color: #767680; font-weight: 400; font-size: 0.85em; }
  .blurb { margin: 0.3rem 0 0; color: #3a3a3f; }
  @media (prefers-color-scheme: dark) { .blurb { color: #c2c2c8; } }
  nav.days { margin-bottom: 2rem; }
  nav.days a { margin-right: 0.75rem; }
`;

function renderArticle(a) {
  const readTime = a.readTime ? ` <span class="readtime">(${escapeHtml(a.readTime)})</span>` : "";
  const blurb = a.blurb ? `<p class="blurb">${escapeHtml(a.blurb)}</p>` : "";
  return `<article>
    <a class="headline" href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.headline)}</a>${readTime}
    ${blurb}
  </article>`;
}

function renderEdition(edition) {
  const sections = edition.sections
    .map(
      (s) => `<h3 class="section">${escapeHtml(s.title)}</h3>\n${s.articles.map(renderArticle).join("\n")}`
    )
    .join("\n");
  return `<section>\n<h2 class="edition">${escapeHtml(edition.name)}</h2>\n${sections}\n</section>`;
}

// editions: [{ name, sections: [{ title, articles: [{headline,url,readTime,blurb}] }] }]
function buildDailyHtml(isoDate, editions) {
  const body = editions.map(renderEdition).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TLDR Digest — ${escapeHtml(isoDate)}</title>
<style>${PAGE_STYLES}</style>
</head>
<body>
<h1>TLDR Digest</h1>
<div class="date">${escapeHtml(isoDate)}</div>
${body}
</body>
</html>`;
}

function buildIndexHtml(days) {
  // days: [{ slug, isoDate }], newest first
  const links = days
    .map((d) => `<li><a href="${escapeHtml(d.slug)}.html">${escapeHtml(d.isoDate)}</a></li>`)
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TLDR Digest — Archive</title>
<style>${PAGE_STYLES}\nul { list-style: none; padding: 0; } li { padding: 0.4rem 0; font-size: 1.05rem; }</style>
</head>
<body>
<h1>TLDR Digest — Archive</h1>
<ul>
${links}
</ul>
</body>
</html>`;
}

module.exports = { dateToSlug, buildDailyHtml, buildIndexHtml };
