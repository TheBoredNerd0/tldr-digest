const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const EDITION_EMOJI = {
  Tech: "💻", AI: "🤖", Data: "📊", Dev: "👨‍💻", Design: "🎨",
  DevOps: "🛠️", Marketing: "📣", Product: "📦", Founders: "🚀",
  Infosec: "🔒", Crypto: "₿", Fintech: "💳", Hardware: "⚙️", IT: "🖥️",
};

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

// Deterministic accent color per edition (for the placeholder cover when an
// article has no scrapeable og:image), so each edition still reads consistently.
function hashHue(seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

const PAGE_STYLES = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem 1rem 4rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    max-width: 1100px; margin-inline: auto; line-height: 1.5;
    background: #f2f2f5; color: #1a1a1a;
  }
  @media (prefers-color-scheme: dark) { body { background: #0d0e12; color: #e8e8ea; } }
  h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
  .date { color: #767680; margin-bottom: 2rem; font-size: 0.95rem; }
  h2.edition {
    font-size: 1.3rem; margin: 2.5rem 0 1rem; display: flex; align-items: center; gap: 0.5rem;
  }
  h3.section { font-size: 0.85rem; color: #767680; margin: 1.5rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
  .card {
    background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }
  @media (prefers-color-scheme: dark) { .card { background: #1b1c22; box-shadow: none; border: 1px solid #2a2b33; } }
  .card .cover { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; background: #ddd; }
  .card .cover.placeholder {
    display: flex; align-items: center; justify-content: center; font-size: 2.5rem;
  }
  .card summary {
    list-style: none; cursor: pointer; padding: 0.85rem 0.9rem; font-weight: 600; font-size: 0.95rem;
  }
  .card summary::-webkit-details-marker { display: none; }
  .card summary::after { content: "＋"; float: right; color: #767680; font-weight: 400; }
  .card details[open] summary::after { content: "－"; }
  .card .readtime { display: block; font-weight: 400; color: #767680; font-size: 0.8em; margin-top: 0.15rem; }
  .card .blurb { margin: 0 0.9rem 0.9rem; color: #3a3a3f; font-size: 0.9rem; }
  @media (prefers-color-scheme: dark) { .card .blurb { color: #b9b9c2; } }
  .card .blurb a { color: inherit; }

  nav.days { margin-bottom: 2rem; }
  nav.days a { margin-right: 0.75rem; }
`;

function renderCover(a, hue) {
  if (a.image) {
    return `<img class="cover" src="${escapeHtml(a.image)}" loading="lazy" alt="">`;
  }
  return `<div class="cover placeholder" style="background: linear-gradient(135deg, hsl(${hue},55%,45%), hsl(${(hue + 40) % 360},55%,30%));">📰</div>`;
}

function renderArticle(a, edition) {
  const hue = hashHue(edition.name + a.headline);
  const readTime = a.readTime ? `<span class="readtime">${escapeHtml(a.readTime)}</span>` : "";
  const blurb = a.blurb
    ? `<p class="blurb">${escapeHtml(a.blurb)} <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">Read more →</a></p>`
    : `<p class="blurb"><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">Read more →</a></p>`;
  return `<div class="card">
    ${renderCover(a, hue)}
    <details>
      <summary>${escapeHtml(a.headline)}${readTime}</summary>
      ${blurb}
    </details>
  </div>`;
}

function renderEdition(edition) {
  const sections = edition.sections
    .map(
      (s) =>
        `<h3 class="section">${escapeHtml(s.title)}</h3>\n<div class="grid">\n${s.articles
          .map((a) => renderArticle(a, edition))
          .join("\n")}\n</div>`
    )
    .join("\n");
  const emoji = EDITION_EMOJI[edition.name] || "📰";
  return `<section>\n<h2 class="edition">${emoji} ${escapeHtml(edition.name)}</h2>\n${sections}\n</section>`;
}

// editions: [{ name, sections: [{ title, articles: [{headline,url,readTime,blurb,image}] }] }]
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
