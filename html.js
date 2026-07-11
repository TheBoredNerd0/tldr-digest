const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const EDITION_EMOJI = {
  "TLDR Tech": "💻", "TLDR AI": "🤖", "TLDR Data": "📊", "TLDR Dev": "👨‍💻", "TLDR Design": "🎨",
  "TLDR DevOps": "🛠️", "TLDR Marketing": "📣", "TLDR Product": "📦", "TLDR Founders": "🚀",
  "TLDR Infosec": "🔒", "TLDR Crypto": "₿", "TLDR Fintech": "💳", "TLDR Hardware": "⚙️", "TLDR IT": "🖥️",
  "Hacker News": "🔶", "The Rundown AI": "⚡", Featured: "⭐", "GitHub Trending": "🐙",
  "BBC World": "🌍", "Guardian World": "🇬🇧", "Al Jazeera": "🕌", "NYT World": "🗽", "NPR World": "🎙️",
  "Straits Times": "🇸🇬", Mothership: "🚢",
};

// "2026-07-09" -> "09-july-2026" (matches the requested filename convention)
function dateToSlug(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${MONTHS[parseInt(m, 10) - 1]}-${y}`;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
  :root[data-theme="dark"] body { background: #0d0e12; color: #e8e8ea; }
  :root[data-theme="light"] body { background: #f2f2f5; color: #1a1a1a; }

  .topbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.25rem; }
  h1 { font-size: 1.6rem; margin: 0; }
  .date { color: #767680; margin-bottom: 1rem; font-size: 0.95rem; }

  .theme-toggle {
    flex: none; border: none; cursor: pointer; font-size: 1.1rem; background: #fff;
    border-radius: 999px; width: 2.25rem; height: 2.25rem; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  @media (prefers-color-scheme: dark) { .theme-toggle { background: #1b1c22; border: 1px solid #2a2b33; } }
  :root[data-theme="dark"] .theme-toggle { background: #1b1c22; border: 1px solid #2a2b33; }
  :root[data-theme="light"] .theme-toggle { background: #fff; border: none; }

  .searchbar { margin-bottom: 1rem; }
  .searchbar input {
    width: 100%; font-size: 1rem; padding: 0.65rem 0.9rem; border-radius: 10px; border: 1px solid #d5d5da;
    background: #fff; color: inherit;
  }
  @media (prefers-color-scheme: dark) { .searchbar input { background: #1b1c22; border-color: #2a2b33; } }
  :root[data-theme="dark"] .searchbar input { background: #1b1c22; border-color: #2a2b33; }
  :root[data-theme="light"] .searchbar input { background: #fff; border-color: #d5d5da; }
  .search-count { font-size: 0.8rem; color: #767680; margin: 0.4rem 0 0; }

  .quicknav {
    position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: nowrap; gap: 0.4rem;
    padding: 0.75rem 0; margin-bottom: 1.5rem; background: #f2f2f5;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  @media (prefers-color-scheme: dark) { .quicknav { background: #0d0e12; } }
  :root[data-theme="dark"] .quicknav { background: #0d0e12; }
  :root[data-theme="light"] .quicknav { background: #f2f2f5; }
  .quicknav a {
    flex: none; font-size: 0.8rem; text-decoration: none; color: inherit; background: #fff;
    border-radius: 999px; padding: 0.3rem 0.7rem; box-shadow: 0 1px 2px rgba(0,0,0,0.1); white-space: nowrap;
    border: 2px solid transparent;
  }
  @media (prefers-color-scheme: dark) { .quicknav a { background: #1b1c22; border-color: #2a2b33; } }
  :root[data-theme="dark"] .quicknav a { background: #1b1c22; border-color: #2a2b33; }
  :root[data-theme="light"] .quicknav a { background: #fff; }
  .quicknav a.active { border-color: #3b82f6; font-weight: 600; }

  section[id] { scroll-margin-top: 3.5rem; }
  details.edition-toggle summary.edition {
    list-style: none; cursor: pointer; font-size: 1.3rem; margin: 2rem 0 1rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  details.edition-toggle summary.edition::-webkit-details-marker { display: none; }
  details.edition-toggle summary.edition::after {
    content: "▾"; margin-left: auto; color: #767680; font-size: 1rem; transition: transform 0.15s;
  }
  details.edition-toggle[open] summary.edition::after { transform: rotate(180deg); }
  details.edition-toggle summary.edition .count { color: #767680; font-weight: 400; font-size: 0.85rem; }

  h3.section { font-size: 0.85rem; color: #767680; margin: 1.5rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }

  h2.edition.featured { font-size: 1.6rem; margin: 0 0 1rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
  .grid.featured { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; margin-bottom: 1rem; }
  .grid.featured .card { box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
  @media (prefers-color-scheme: dark) { .grid.featured .card { border-color: #3a3b45; } }
  .grid.featured .card .headline { font-size: 1.1rem; }

  .card {
    background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    transition: opacity 0.15s;
  }
  @media (prefers-color-scheme: dark) { .card { background: #1b1c22; box-shadow: none; border: 1px solid #2a2b33; } }
  :root[data-theme="dark"] .card { background: #1b1c22; box-shadow: none; border: 1px solid #2a2b33; }
  :root[data-theme="light"] .card { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); border: none; }
  .card.is-read { opacity: 0.55; }
  .card[hidden] { display: none; }

  .card summary { list-style: none; cursor: pointer; display: block; }
  .card summary::-webkit-details-marker { display: none; }

  .cover-wrap { position: relative; }
  .card .cover { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; background: #ddd; }
  .card .cover.placeholder { display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
  .overlay {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 1.5rem 0.9rem 0.6rem;
    background: linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0));
    color: #fff;
  }
  .overlay .source {
    display: block; font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.04em; color: rgba(255,255,255,0.85);
  }
  .overlay .headline { display: block; font-weight: 700; font-size: 1rem; margin-top: 0.2rem; line-height: 1.3; }
  .overlay .readtime { display: block; font-weight: 400; color: rgba(255,255,255,0.75); font-size: 0.78rem; margin-top: 0.2rem; }
  .expand-indicator {
    position: absolute; top: 0.6rem; right: 0.6rem; width: 1.6rem; height: 1.6rem; border-radius: 50%;
    background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
  }
  .expand-indicator::before { content: "＋"; }
  details[open] .expand-indicator { background: rgba(0,0,0,0.75); }
  details[open] .expand-indicator::before { content: "－"; }

  .blurb-wrap { padding: 0.85rem 0.9rem; }
  .card .blurb { margin: 0; color: #3a3a3f; font-size: 1rem; }
  @media (prefers-color-scheme: dark) { .card .blurb { color: #b9b9c2; } }
  :root[data-theme="dark"] .card .blurb { color: #b9b9c2; }
  :root[data-theme="light"] .card .blurb { color: #3a3a3f; }
  .card .blurb a { color: inherit; }

  nav.days { margin-bottom: 2rem; }
  nav.days a { margin-right: 0.75rem; }
`;

const PAGE_SCRIPT = `
(function () {
  // Each feature below is independently wrapped — a failure in one (e.g. a browser
  // without matchMedia, or localStorage disabled in a privacy mode) must not take
  // down the other two, since they were originally one shared try-less block and
  // a single throw silently disabled search and read-tracking along with theme.

  try {
    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem('tldr-theme'); } catch (e) {}
    if (stored) root.setAttribute('data-theme', stored);

    var toggle = document.getElementById('theme-toggle');
    function currentIsDark() {
      var attr = root.getAttribute('data-theme');
      if (attr) return attr === 'dark';
      try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
    }
    function updateToggleLabel() { toggle.textContent = currentIsDark() ? '☀️' : '🌙'; }
    updateToggleLabel();
    toggle.addEventListener('click', function () {
      var next = currentIsDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('tldr-theme', next); } catch (e) {}
      updateToggleLabel();
    });
  } catch (e) { /* theme toggle unavailable, rest of the page still works */ }

  var cards = document.querySelectorAll('.card[data-url]');

  try {
    // Read-state: mark a card faded once its details has been opened, persisted
    // across visits by article URL so re-opening the same day's page still shows
    // what you've already looked at.
    var READ_KEY = 'tldr-read-urls';
    var readUrls = {};
    try { readUrls = JSON.parse(localStorage.getItem(READ_KEY) || '{}'); } catch (e) {}
    cards.forEach(function (card) {
      if (readUrls[card.dataset.url]) card.classList.add('is-read');
      var details = card.querySelector('details');
      if (details) {
        details.addEventListener('toggle', function () {
          if (details.open) {
            readUrls[card.dataset.url] = 1;
            try { localStorage.setItem(READ_KEY, JSON.stringify(readUrls)); } catch (e) {}
            card.classList.add('is-read');
          }
        });
      }
    });
  } catch (e) { /* read-tracking unavailable, rest of the page still works */ }

  try {
    // Tab filter: clicking a quicknav pill shows *only* that source's section and
    // force-opens it (instead of just scrolling to it while everything else still
    // sits there collapsed) — the point is fewer sections to scroll past as more
    // sources get added over time, not just faster navigation to one of many.
    var navLinks = document.querySelectorAll('.quicknav a[data-target]');
    var allSections = document.querySelectorAll('section[id]');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (evt) {
        evt.preventDefault();
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
        var target = link.dataset.target;
        var targetSection = null;
        allSections.forEach(function (section) {
          var visible = target === 'all' || section.id === target;
          section.hidden = !visible;
          if (target !== 'all' && section.id === target) targetSection = section;
        });
        if (targetSection) {
          var d = targetSection.querySelector('details.edition-toggle');
          if (d) d.open = true;
          try { targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
        }
      });
    });
  } catch (e) { /* tab filter unavailable, sections still reachable via scroll */ }

  try {
    // Live search across headline + blurb + source, expanding collapsed sections
    // that contain a match so results are visible without manually opening each one.
    var search = document.getElementById('search-input');
    var countEl = document.getElementById('search-count');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        var shown = 0;
        var sectionsWithMatch = new Set();
        cards.forEach(function (card) {
          var haystack = (card.dataset.headline + ' ' + card.dataset.blurb + ' ' + card.dataset.source).toLowerCase();
          var match = q === '' || haystack.indexOf(q) !== -1;
          card.hidden = !match;
          if (match) {
            shown++;
            var section = card.closest('section[id]');
            if (section) sectionsWithMatch.add(section);
          }
        });
        if (q !== '') {
          sectionsWithMatch.forEach(function (section) {
            var d = section.querySelector('details.edition-toggle');
            if (d) d.open = true;
          });
          countEl.textContent = shown + ' matching article' + (shown === 1 ? '' : 's');
        } else {
          countEl.textContent = '';
        }
      });
    }
  } catch (e) { /* search unavailable, rest of the page still works */ }
})();
`;

function renderCover(a, hue) {
  if (a.image) {
    return `<img class="cover" src="${escapeHtml(a.image)}" loading="lazy" alt="">`;
  }
  return `<div class="cover placeholder" style="background: linear-gradient(135deg, hsl(${hue},55%,45%), hsl(${(hue + 40) % 360},55%,30%));">📰</div>`;
}

function renderArticle(a, edition) {
  const sourceName = a.sourceLabel || edition.name;
  const hue = hashHue(sourceName + a.headline);
  const emoji = EDITION_EMOJI[sourceName] || "📰";
  const readTime = a.readTime ? `<span class="readtime">${escapeHtml(a.readTime)}</span>` : "";
  const blurb = a.blurb
    ? `<p class="blurb">${escapeHtml(a.blurb)} <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">Read more →</a></p>`
    : `<p class="blurb"><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer">Read more →</a></p>`;
  const searchAttrs = [
    `data-url="${escapeHtml(a.url)}"`,
    `data-headline="${escapeHtml(a.headline)}"`,
    `data-blurb="${escapeHtml(a.blurb || "")}"`,
    `data-source="${escapeHtml(sourceName)}"`,
  ].join(" ");
  return `<div class="card" ${searchAttrs}>
    <details>
      <summary>
        <div class="cover-wrap">
          ${renderCover(a, hue)}
          <span class="expand-indicator"></span>
          <div class="overlay">
            <span class="source">${emoji} ${escapeHtml(sourceName)}</span>
            <span class="headline">${escapeHtml(a.headline)}</span>
            ${readTime}
          </div>
        </div>
      </summary>
      <div class="blurb-wrap">${blurb}</div>
    </details>
  </div>`;
}

function renderEdition(edition) {
  const isFeatured = edition.name === "Featured";
  const gridClass = isFeatured ? "grid featured" : "grid";
  const count = edition.sections.reduce((n, s) => n + s.articles.length, 0);
  const sections = edition.sections
    .map(
      (s) =>
        `${isFeatured ? "" : `<h3 class="section">${escapeHtml(s.title)}</h3>\n`}<div class="${gridClass}">\n${s.articles
          .map((a) => renderArticle(a, edition))
          .join("\n")}\n</div>`
    )
    .join("\n");
  const emoji = EDITION_EMOJI[edition.name] || "📰";
  const id = slugify(edition.name);

  if (isFeatured) {
    return `<section id="${id}">\n<h2 class="edition featured">${emoji} ${escapeHtml(edition.name)}</h2>\n${sections}\n</section>`;
  }
  // Collapsed by default — with 240+ articles across 20 sources, forcing a linear
  // scroll past everything is the "too much scrolling" problem being fixed here.
  return `<section id="${id}">
<details class="edition-toggle">
<summary class="edition">${emoji} ${escapeHtml(edition.name)} <span class="count">${count}</span></summary>
${sections}
</details>
</section>`;
}

function renderQuickNav(editions) {
  const allPill = `<a href="#" data-target="all" class="active">📚 All</a>`;
  const pills = editions
    .map(
      (e) =>
        `<a href="#${slugify(e.name)}" data-target="${slugify(e.name)}">${EDITION_EMOJI[e.name] || "📰"} ${escapeHtml(e.name)}</a>`
    )
    .join("\n");
  return `<nav class="quicknav">\n${allPill}\n${pills}\n</nav>`;
}

// editions: [{ name, sections: [{ title, articles: [{headline,url,readTime,blurb,image}] }] }]
function buildDailyHtml(isoDate, editions) {
  const nav = renderQuickNav(editions);
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
<div class="topbar">
<h1>TLDR Digest</h1>
<button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">🌙</button>
</div>
<div class="date">${escapeHtml(isoDate)}</div>
<div class="searchbar">
<input id="search-input" type="text" placeholder="Search today's articles…" autocomplete="off">
<p id="search-count" class="search-count"></p>
</div>
${nav}
${body}
<script>${PAGE_SCRIPT}</script>
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
