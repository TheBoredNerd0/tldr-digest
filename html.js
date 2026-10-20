const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const EDITION_EMOJI = {
  "TLDR Tech": "💻", "TLDR AI": "🤖", "TLDR Data": "📊", "TLDR Dev": "👨‍💻", "TLDR Design": "🎨",
  "TLDR DevOps": "🛠️", "TLDR Marketing": "📣", "TLDR Product": "📦", "TLDR Founders": "🚀",
  "TLDR Infosec": "🔒", "TLDR Crypto": "₿", "TLDR Fintech": "💳", "TLDR Hardware": "⚙️", "TLDR IT": "🖥️",
  "Hacker News": "🔶", "The Rundown AI": "⚡", Featured: "⭐", "GitHub Trending": "🐙",
  "World News": "🌍", "BBC World": "🌍", "Guardian World": "🇬🇧", "Al Jazeera": "🕌", "NYT World": "🗽", "NPR World": "🎙️",
  DW: "🇩🇪", France24: "🇫🇷", "CNN World": "📡", "Washington Post World": "🏛️", SCMP: "🇭🇰",
  "Singapore News": "🇸🇬", "Straits Times": "🇸🇬", Mothership: "🚢",
  "Krebs on Security": "🕵️", "The Hacker News": "🔓", "Dark Reading": "📕",
  OpenAI: "🟢", "Google DeepMind": "🔷", "Google Research": "🔬", "Hugging Face": "🤗",
  "TechCrunch AI": "📰", "VentureBeat AI": "📰", "MIT Technology Review AI": "📰",
  // Topic groups (spanning multiple underlying sources)
  AI: "🤖", "Tech & Startups": "💻", "Programming & Data": "👨‍💻",
  "Business & Finance": "💰", "Security & IT": "🔐", "Developer Community": "👥",
};

const SITE_NAME = "TLDR Digest";
const SITE_DESCRIPTION =
  "A daily one-page digest of AI, tech, security, world and Singapore news from 30 sources.";

// "2026-07-09" -> "09-july-2026" (matches the requested filename convention)
function dateToSlug(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${MONTHS[parseInt(m, 10) - 1]}-${y}`;
}

// "09-july-2026" -> "2026-07-09"
function slugToIso(slug) {
  const [d, mName, y] = slug.split("-");
  const m = String(MONTHS.indexOf(mName) + 1).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const cap = (w) => w[0].toUpperCase() + w.slice(1);

// "2026-10-20" -> "Tuesday 20 October 2026". Formatted by hand rather than with
// Intl: ICU builds disagree on details (some insert a comma after the weekday),
// and a title that changes between the Actions runner and a local rebuild would
// churn every page. Computed in UTC so the weekday can't drift with the host TZ.
// opts picks the parts, Intl-style: { weekday: "long"|"short", day, month: "long"|"short", year }.
function formatLongDate(isoDate, opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const parts = [];
  if (opts.weekday) parts.push(opts.weekday === "short" ? WEEKDAYS[d.getUTCDay()].slice(0, 3) : WEEKDAYS[d.getUTCDay()]);
  if (opts.day) parts.push(String(d.getUTCDate()));
  if (opts.month) {
    const m = cap(MONTHS[d.getUTCMonth()]);
    parts.push(opts.month === "short" ? m.slice(0, 3) : m);
  }
  if (opts.year) parts.push(String(d.getUTCFullYear()));
  return parts.join(" ");
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Scraped URLs go straight into href/src/CSS url(). Only allow http(s) so a feed
// item carrying a javascript: or data: URL can't turn into script on the page.
function safeUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

// Deterministic accent color per edition (for the placeholder cover when an
// article has no scrapeable og:image), so each edition still reads consistently.
function hashHue(seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

// Colours live in custom properties, set once per theme. The page previously
// repeated every themed rule three times (OS dark preference, forced dark, forced
// light), which is how individual components drifted out of sync. Muted text is
// #5c5c66 / #a0a0ab: >= 4.5:1 on both backgrounds (the old #767680 was ~4:1).
const PAGE_STYLES = `
  :root {
    color-scheme: light;
    --bg: #f2f2f5; --surface: #ffffff; --surface-2: #e7e7ec; --border: #d5d5da;
    --text: #1a1a1a; --muted: #5c5c66; --blurb: #3a3a3f; --accent: #2563eb;
    --shadow: 0 1px 3px rgba(0,0,0,0.12); --shadow-lg: 0 2px 10px rgba(0,0,0,0.15);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --bg: #0d0e12; --surface: #1b1c22; --surface-2: #24252d; --border: #2f3039;
      --text: #e8e8ea; --muted: #a0a0ab; --blurb: #b9b9c2; --accent: #7aa7ff;
      --shadow: none; --shadow-lg: none;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --bg: #0d0e12; --surface: #1b1c22; --surface-2: #24252d; --border: #2f3039;
    --text: #e8e8ea; --muted: #a0a0ab; --blurb: #b9b9c2; --accent: #7aa7ff;
    --shadow: none; --shadow-lg: none;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0 auto; padding: 1.25rem 1rem 4rem; max-width: 1100px; line-height: 1.5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg); color: var(--text);
  }
  a { color: var(--accent); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .skip-link { position: absolute; left: -999px; top: 0.5rem; background: var(--surface); padding: 0.5rem 0.75rem; z-index: 50; }
  .skip-link:focus { left: 0.5rem; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }

  /* ---- header ---- */
  .topbar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem; }
  .brand { font-size: 1.35rem; font-weight: 800; color: var(--text); text-decoration: none; letter-spacing: -0.01em; }
  .tools { display: flex; gap: 0.4rem; }
  .tool {
    flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 0.2rem;
    min-width: 2.4rem; height: 2.4rem; padding: 0 0.6rem; border-radius: 999px; cursor: pointer;
    font: inherit; font-size: 1rem; color: var(--text); text-decoration: none;
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow);
  }
  .tool[aria-current="page"] { border-color: var(--accent); }
  .tool .count { font-size: 0.75rem; font-weight: 700; }
  .tool .count:empty { display: none; }

  h1.page-title { font-size: 1.6rem; margin: 0.25rem 0 0.1rem; line-height: 1.2; }
  .subtle { color: var(--muted); font-size: 0.95rem; margin: 0 0 1rem; }

  /* ---- day navigation ---- */
  .daynav { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin: 0 0 1rem; font-size: 0.9rem; }
  .daynav a { text-decoration: none; padding: 0.35rem 0.1rem; }
  .daynav a[hidden] { display: inline-block; visibility: hidden; }

  /* ---- search ---- */
  .searchbar { margin-bottom: 1rem; }
  .searchbar input {
    width: 100%; font: inherit; font-size: 1rem; padding: 0.65rem 0.9rem; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface); color: inherit;
  }
  .search-count { font-size: 0.85rem; color: var(--muted); margin: 0.4rem 0 0; min-height: 1.2em; }
  kbd { font: 0.75rem/1 ui-monospace, monospace; padding: 0.1rem 0.35rem; border: 1px solid var(--border); border-radius: 4px; }

  /* ---- topic pills ---- */
  .quicknav {
    position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: nowrap; gap: 0.4rem;
    padding: 0.75rem 0; margin-bottom: 1.5rem; background: var(--bg);
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .quicknav a {
    flex: none; font-size: 0.8rem; text-decoration: none; color: inherit; background: var(--surface);
    border-radius: 999px; padding: 0.3rem 0.7rem; box-shadow: var(--shadow); white-space: nowrap;
    border: 2px solid var(--border);
  }
  .quicknav a.active { border-color: var(--accent); font-weight: 600; }

  /* ---- topic tiles ---- */
  #category-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem; margin: 0.5rem 0 2.5rem;
  }
  .category-tile {
    position: relative; aspect-ratio: 4/3; border-radius: 14px; overflow: hidden;
    text-decoration: none; color: #fff; background-size: cover; background-position: center;
    background-color: #333; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .tile-overlay {
    position: absolute; inset: 0; padding: 0.6rem;
    background: linear-gradient(to top, rgba(0,0,0,0.78) 20%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.35));
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .tile-emoji { position: absolute; top: 0.5rem; left: 0.6rem; font-size: 1.3rem; }
  .tile-name { font-weight: 700; font-size: 0.95rem; line-height: 1.25; }
  .tile-count { font-size: 0.75rem; opacity: 0.9; margin-top: 0.15rem; }

  /* ---- sections ---- */
  section[id] { scroll-margin-top: 3.5rem; }
  details.edition-toggle summary.edition {
    list-style: none; cursor: pointer; font-size: 1.3rem; font-weight: 700; margin: 2rem 0 1rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  details.edition-toggle summary.edition::-webkit-details-marker { display: none; }
  details.edition-toggle summary.edition::after {
    content: "▾"; margin-left: auto; color: var(--muted); font-size: 1rem; transition: transform 0.15s;
  }
  details.edition-toggle[open] summary.edition::after { transform: rotate(180deg); }
  details.edition-toggle summary.edition .count { color: var(--muted); font-weight: 400; font-size: 0.85rem; }
  h3.section { font-size: 0.85rem; color: var(--muted); margin: 1.5rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
  h2.edition.featured { font-size: 1.6rem; margin: 0 0 1rem; }

  /* ---- cards ---- */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
  .grid.featured { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; margin-bottom: 1rem; }
  .grid.featured .card { box-shadow: var(--shadow-lg); }
  .grid.featured .card .headline { font-size: 1.1rem; }

  .card {
    position: relative; background: var(--surface); border-radius: 14px; overflow: hidden;
    box-shadow: var(--shadow); border: 1px solid transparent; transition: opacity 0.15s;
  }
  :root[data-theme="dark"] .card { border-color: var(--border); }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .card { border-color: var(--border); } }
  .card.is-read { opacity: 0.55; }
  .card[hidden] { display: none; }
  .card summary { list-style: none; cursor: pointer; display: block; }
  .card summary::-webkit-details-marker { display: none; }

  .cover-wrap { position: relative; }
  .card .cover { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; background: var(--surface-2); }
  .card .cover.placeholder { display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
  .overlay {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 1.5rem 0.9rem 0.6rem;
    background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0)); color: #fff;
  }
  .overlay .source {
    display: block; font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.04em; color: rgba(255,255,255,0.9);
  }
  .overlay .headline { display: block; font-weight: 700; font-size: 1rem; margin-top: 0.2rem; line-height: 1.3; }
  .overlay .readtime { display: block; font-weight: 400; color: rgba(255,255,255,0.8); font-size: 0.78rem; margin-top: 0.2rem; }
  .expand-indicator {
    position: absolute; top: 0.6rem; right: 0.6rem; width: 1.6rem; height: 1.6rem; border-radius: 50%;
    background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
  }
  .expand-indicator::before { content: "＋"; }
  details[open] .expand-indicator { background: rgba(0,0,0,0.75); }
  details[open] .expand-indicator::before { content: "－"; }

  .save {
    position: absolute; top: 0.55rem; left: 0.55rem; z-index: 2; width: 1.9rem; height: 1.9rem;
    border-radius: 50%; border: none; cursor: pointer; font-size: 1rem; line-height: 1;
    background: rgba(0,0,0,0.55); color: #fff;
  }
  .save[aria-pressed="true"] { color: #ffcc33; background: rgba(0,0,0,0.75); }

  .blurb-wrap { padding: 0.85rem 0.9rem; }
  .card .blurb { margin: 0; color: var(--blurb); font-size: 1rem; }
  .card .blurb a { color: inherit; }

  /* ---- compact list view (toggle in the header) ----
     Lists scan faster than cards when you're skimming for something specific
     (NN/g cards research); the same markup reflows into one row per story. */
  :root[data-view="compact"] .grid,
  :root[data-view="compact"] .grid.featured { grid-template-columns: 1fr; gap: 0.4rem; }
  :root[data-view="compact"] .card { border-radius: 10px; box-shadow: none; border-color: var(--border); }
  :root[data-view="compact"] .cover-wrap { display: flex; align-items: center; gap: 0.75rem; padding: 0.45rem 2.6rem 0.45rem 2.7rem; }
  :root[data-view="compact"] .card .cover { width: 64px; height: 64px; aspect-ratio: 1; flex: none; border-radius: 8px; }
  :root[data-view="compact"] .card .cover.placeholder { font-size: 1.4rem; }
  :root[data-view="compact"] .overlay { position: static; padding: 0; background: none; color: var(--text); }
  :root[data-view="compact"] .overlay .source,
  :root[data-view="compact"] .overlay .readtime { color: var(--muted); }
  :root[data-view="compact"] .grid.featured .card .headline { font-size: 1rem; }
  :root[data-view="compact"] .expand-indicator { top: 50%; transform: translateY(-50%); background: var(--surface-2); color: var(--text); }
  :root[data-view="compact"] .save { top: 50%; transform: translateY(-50%); background: var(--surface-2); color: var(--muted); }
  :root[data-view="compact"] .save[aria-pressed="true"] { color: #d99a00; }

  /* ---- home / archive ---- */
  .lead {
    display: grid; grid-template-columns: 1fr; text-decoration: none; color: inherit;
    background: var(--surface); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow-lg);
    border: 1px solid var(--border); margin: 0.5rem 0 2rem;
  }
  @media (min-width: 720px) { .lead { grid-template-columns: 1.1fr 1fr; } }
  .lead-image { min-height: 180px; background-size: cover; background-position: center; background-color: var(--surface-2); }
  .lead-body { padding: 1.25rem 1.25rem 1.4rem; }
  .eyebrow { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
  .lead h2 { margin: 0.3rem 0 0.75rem; font-size: 1.5rem; line-height: 1.2; }
  .lead ul { margin: 0 0 1rem; padding-left: 1.1rem; }
  .lead li { margin: 0.35rem 0; font-weight: 600; }
  .cta { display: inline-block; font-weight: 700; color: var(--accent); }

  .month h2 { font-size: 1.05rem; margin: 2rem 0 0.5rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .days { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border); }
  .day-row {
    display: grid; grid-template-columns: 3.4rem 1fr auto; gap: 0.75rem; align-items: center;
    padding: 0.7rem 0.25rem; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit;
  }
  .day-row:hover .day-top { color: var(--accent); }
  .day-date { text-align: center; line-height: 1.1; }
  .day-date b { display: block; font-size: 1.35rem; }
  .day-date span { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; }
  .day-top { font-size: 0.95rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .day-count { font-size: 0.8rem; color: var(--muted); white-space: nowrap; }

  /* ---- search-all / saved lists ---- */
  .results { list-style: none; padding: 0; margin: 0; }
  .result { display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.7rem 0; border-bottom: 1px solid var(--border); }
  .result img, .result .thumb { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex: none; background: var(--surface-2); }
  .result .body { flex: 1; min-width: 0; }
  .result .title { font-weight: 650; color: var(--text); text-decoration: none; }
  .result .title:hover { color: var(--accent); }
  .result .meta { font-size: 0.82rem; color: var(--muted); margin-top: 0.15rem; }
  .result .remove { flex: none; }
  .empty { padding: 2.5rem 1rem; text-align: center; color: var(--muted); border: 1px dashed var(--border); border-radius: 14px; }
  mark { background: rgba(255, 204, 51, 0.45); color: inherit; border-radius: 2px; }

  footer.site-footer { margin-top: 3rem; font-size: 0.85rem; color: var(--muted); display: flex; gap: 1rem; flex-wrap: wrap; }
`;

// Runs before first paint so a saved theme/view applies without a flash of the
// default (the old toggle only ran at the end of <body>).
const HEAD_SCRIPT = `try{var r=document.documentElement,t=localStorage.getItem('tldr-theme'),v=localStorage.getItem('tldr-view');if(t)r.setAttribute('data-theme',t);if(v==='compact')r.setAttribute('data-view','compact');}catch(e){}`;

const PAGE_SCRIPT = `
(function () {
  // Each feature below is independently wrapped: a failure in one (a browser
  // without matchMedia, localStorage disabled in a privacy mode, days.json
  // missing) must not take down the others.
  var root = document.documentElement;
  var MONTHS = ${JSON.stringify(MONTHS)};
  function getItem(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setItem(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function slugOf(d) { var p = d.split('-'); return p[2] + '-' + MONTHS[+p[1] - 1] + '-' + p[0]; }
  function shortDate(d) {
    try { return new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }
    catch (e) { return d; }
  }
  function isHttp(u) { return /^https?:\\/\\//i.test(u || ''); }

  try {
    var toggle = document.getElementById('theme-toggle');
    var currentIsDark = function () {
      var attr = root.getAttribute('data-theme');
      if (attr) return attr === 'dark';
      try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
    };
    var paintTheme = function () {
      var dark = currentIsDark();
      toggle.textContent = dark ? '☀️' : '🌙';
      toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    };
    if (toggle) {
      paintTheme();
      toggle.addEventListener('click', function () {
        var next = currentIsDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        setItem('tldr-theme', next);
        paintTheme();
      });
    }
  } catch (e) {}

  try {
    var viewBtn = document.getElementById('view-toggle');
    var paintView = function () {
      var compact = root.getAttribute('data-view') === 'compact';
      viewBtn.setAttribute('aria-pressed', compact ? 'true' : 'false');
      viewBtn.textContent = compact ? '▦' : '☰';
      viewBtn.title = compact ? 'Switch to card view' : 'Switch to compact list';
    };
    if (viewBtn) {
      paintView();
      viewBtn.addEventListener('click', function () {
        if (root.getAttribute('data-view') === 'compact') { root.removeAttribute('data-view'); setItem('tldr-view', null); }
        else { root.setAttribute('data-view', 'compact'); setItem('tldr-view', 'compact'); }
        paintView();
      });
    }
  } catch (e) {}

  // Saved articles: kept in this browser only (no accounts, no server), keyed by
  // article URL, with enough fields for saved.html to render them on its own.
  var SAVED_KEY = 'tldr-saved';
  function loadSaved() { try { return JSON.parse(getItem(SAVED_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function persistSaved(s) { setItem(SAVED_KEY, JSON.stringify(s)); }
  function paintSavedCount() {
    var n = Object.keys(loadSaved()).length;
    document.querySelectorAll('[data-saved-count]').forEach(function (el) { el.textContent = n ? String(n) : ''; });
  }
  try { paintSavedCount(); } catch (e) {}

  var cards = document.querySelectorAll('.card[data-url]');

  try {
    var saved = loadSaved();
    cards.forEach(function (card) {
      var btn = card.querySelector('.save');
      if (!btn) return;
      var url = card.getAttribute('data-url');
      var paint = function (on) {
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = on ? '★' : '☆';
        btn.setAttribute('aria-label', (on ? 'Remove from saved: ' : 'Save for later: ') + card.getAttribute('data-headline'));
      };
      paint(!!saved[url]);
      btn.addEventListener('click', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var s = loadSaved();
        if (s[url]) delete s[url];
        else s[url] = {
          u: url, h: card.getAttribute('data-headline'), s: card.getAttribute('data-source'),
          d: card.getAttribute('data-date') || '', i: card.getAttribute('data-image') || '', t: Date.now()
        };
        persistSaved(s);
        paint(!!s[url]);
        paintSavedCount();
      });
    });
  } catch (e) {}

  try {
    // Read-state: mark a card faded once its details has been opened, persisted
    // across visits by article URL so re-opening the same day's page still shows
    // what you've already looked at.
    var READ_KEY = 'tldr-read-urls';
    var readUrls = {};
    try { readUrls = JSON.parse(getItem(READ_KEY) || '{}') || {}; } catch (e) {}
    cards.forEach(function (card) {
      if (readUrls[card.getAttribute('data-url')]) card.classList.add('is-read');
      var details = card.querySelector('details');
      if (details) {
        details.addEventListener('toggle', function () {
          if (details.open) {
            readUrls[card.getAttribute('data-url')] = 1;
            setItem(READ_KEY, JSON.stringify(readUrls));
            card.classList.add('is-read');
          }
        });
      }
    });
  } catch (e) {}

  try {
    // Tab filter: clicking a quicknav pill or a category tile shows only that
    // topic's section. "All" shows Featured + the category-grid browse view.
    var navLinks = document.querySelectorAll('.quicknav a[data-target]');
    var tileLinks = document.querySelectorAll('.category-tile[data-target]');
    var allSections = document.querySelectorAll('section[id]');
    var grid = document.getElementById('category-grid');

    var applyFilter = function (target) {
      navLinks.forEach(function (l) {
        var on = l.getAttribute('data-target') === target;
        l.classList.toggle('active', on);
        if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
      var targetSection = null;
      allSections.forEach(function (section) {
        var visible = section.id === target || (target === 'all' && section.id === 'featured');
        section.hidden = !visible;
        if (target !== 'all' && section.id === target) targetSection = section;
      });
      if (grid) grid.hidden = target !== 'all';
      if (targetSection) {
        var d = targetSection.querySelector('details.edition-toggle');
        if (d) d.open = true;
        try { targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      }
    };

    var bind = function (el) {
      el.addEventListener('click', function (evt) { evt.preventDefault(); applyFilter(el.getAttribute('data-target')); });
    };
    navLinks.forEach(bind);
    tileLinks.forEach(bind);

    // The server-rendered page has every section visible (works with JS off).
    // Once JS runs, switch to the browse view: Featured + topic tiles.
    if (navLinks.length) applyFilter('all');
  } catch (e) {}

  try {
    // Live search over everything on the card (headline, source, summary). The
    // summary is read from the card's own text rather than a duplicate data-blurb
    // attribute, which used to roughly double the page's text payload.
    var search = document.getElementById('search-input');
    var countEl = document.getElementById('search-count');
    if (search && cards.length) {
      var haystacks = [];
      cards.forEach(function (card) { haystacks.push(card.textContent.toLowerCase()); });
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        var sections = document.querySelectorAll('section[id]');
        var browseGrid = document.getElementById('category-grid');
        if (q !== '') {
          sections.forEach(function (section) { section.hidden = false; });
          if (browseGrid) browseGrid.hidden = true;
        }
        var shown = 0;
        var withMatch = [];
        cards.forEach(function (card, i) {
          var match = q === '' || haystacks[i].indexOf(q) !== -1;
          card.hidden = !match;
          if (match) {
            shown++;
            var section = card.closest('section[id]');
            if (section && withMatch.indexOf(section) === -1) withMatch.push(section);
          }
        });
        countEl.textContent = '';
        if (q !== '') {
          withMatch.forEach(function (section) {
            var d = section.querySelector('details.edition-toggle');
            if (d) d.open = true;
          });
          countEl.appendChild(document.createTextNode(shown + ' matching article' + (shown === 1 ? '' : 's') + ' today · '));
          var all = document.createElement('a');
          all.href = 'search.html?q=' + encodeURIComponent(search.value.trim());
          all.textContent = 'search every day →';
          countEl.appendChild(all);
        } else {
          var allPill = document.querySelector('.quicknav a[data-target="all"]');
          if (allPill) allPill.dispatchEvent(new Event('click'));
          else if (browseGrid) browseGrid.hidden = false;
        }
      });
    }
  } catch (e) {}

  try {
    // "/" jumps to the search box from anywhere; Escape clears it.
    document.addEventListener('keydown', function (evt) {
      var box = document.querySelector('[data-search]');
      if (!box) return;
      var tag = (evt.target && evt.target.tagName) || '';
      if (evt.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag) && !evt.metaKey && !evt.ctrlKey) {
        evt.preventDefault();
        box.focus();
      } else if (evt.key === 'Escape' && evt.target === box && box.value) {
        box.value = '';
        box.dispatchEvent(new Event('input'));
      }
    });
  } catch (e) {}

  try {
    // Previous / next day. Rendered server-side as an "All days" link only, so an
    // old page never points at a stale neighbour; the real neighbours come from
    // days.json, which is rewritten on every publish.
    var dayNav = document.querySelector('.daynav[data-date]');
    if (dayNav && window.fetch) {
      var me = dayNav.getAttribute('data-date');
      fetch('days.json').then(function (r) { return r.json(); }).then(function (days) {
        var idx = -1;
        for (var i = 0; i < days.length; i++) if (days[i].date === me) { idx = i; break; }
        if (idx === -1) return;
        var link = function (sel, day, label) {
          var a = dayNav.querySelector(sel);
          if (!a || !day) return;
          a.href = day.slug + '.html';
          a.textContent = label.replace('%', shortDate(day.date));
          a.hidden = false;
        };
        link('.older', days[idx + 1], '← %');
        link('.newer', days[idx - 1], '% →');
      }).catch(function () {});
    }
  } catch (e) {}

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function resultRow(item, extra) {
    var li = el('li', 'result');
    if (isHttp(item.i)) { var img = el('img'); img.src = item.i; img.alt = ''; img.loading = 'lazy'; li.appendChild(img); }
    var body = el('div', 'body');
    var a = el('a', 'title', item.h);
    a.href = isHttp(item.u) ? item.u : '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    body.appendChild(a);
    var meta = el('div', 'meta', item.s || '');
    if (item.d) {
      meta.appendChild(document.createTextNode(item.s ? ' · ' : ''));
      var day = el('a', null, shortDate(item.d) + ' digest');
      day.href = slugOf(item.d) + '.html';
      meta.appendChild(day);
    }
    body.appendChild(meta);
    li.appendChild(body);
    if (extra) li.appendChild(extra);
    return li;
  }

  try {
    // saved.html
    var savedList = document.getElementById('saved-list');
    if (savedList) {
      var renderSaved = function () {
        var s = loadSaved();
        var items = Object.keys(s).map(function (k) { return s[k]; }).sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
        savedList.textContent = '';
        document.getElementById('saved-empty').hidden = items.length > 0;
        items.forEach(function (item) {
          var rm = el('button', 'tool remove', '✕');
          rm.setAttribute('aria-label', 'Remove from saved: ' + item.h);
          rm.addEventListener('click', function () {
            var cur = loadSaved();
            delete cur[item.u];
            persistSaved(cur);
            renderSaved();
            paintSavedCount();
          });
          savedList.appendChild(resultRow(item, rm));
        });
      };
      renderSaved();
    }
  } catch (e) {}

  try {
    // search.html: month-split index, newest month first, fetched once and cached.
    var allInput = document.getElementById('all-search');
    if (allInput && window.fetch) {
      var status = document.getElementById('all-status');
      var list = document.getElementById('all-results');
      var cache = {};
      var monthsP = fetch('search/months.json').then(function (r) { return r.json(); });
      var loadMonth = function (m) {
        if (!cache[m]) cache[m] = fetch('search/' + m + '.json').then(function (r) { return r.json(); });
        return cache[m];
      };
      var LIMIT = 200;
      var run = 0;
      var doSearch = function () {
        var q = allInput.value.trim().toLowerCase();
        var mine = ++run;
        try { history.replaceState(null, '', q ? '?q=' + encodeURIComponent(allInput.value.trim()) : location.pathname); } catch (e) {}
        list.textContent = '';
        if (q.length < 2) { status.textContent = 'Type at least 2 characters.'; return; }
        var terms = q.split(/\\s+/);
        var found = 0;
        var seen = {};
        monthsP.then(function (months) {
          var step = function (i) {
            if (mine !== run) return;
            if (i >= months.length || found >= LIMIT) {
              status.textContent = found ? (found >= LIMIT ? 'Showing the newest ' + LIMIT + ' matches' : found + ' match' + (found === 1 ? '' : 'es')) : 'No matches in any digest.';
              return;
            }
            status.textContent = 'Searching ' + months[i] + '…';
            loadMonth(months[i]).then(function (rows) {
              if (mine !== run) return;
              for (var r = 0; r < rows.length && found < LIMIT; r++) {
                var row = rows[r];
                if (seen[row[2]]) continue;
                var hay = (row[1] + ' ' + row[3] + ' ' + row[4]).toLowerCase();
                var ok = true;
                for (var t = 0; t < terms.length; t++) if (hay.indexOf(terms[t]) === -1) { ok = false; break; }
                if (!ok) continue;
                seen[row[2]] = 1;
                found++;
                list.appendChild(resultRow({ d: row[0], h: row[1], u: row[2], s: row[3] }));
              }
              step(i + 1);
            }).catch(function () { step(i + 1); });
          };
          step(0);
        }).catch(function () { status.textContent = 'Search index unavailable.'; });
      };
      var timer = null;
      allInput.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(doSearch, 150); });
      var initial = '';
      try { initial = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
      if (initial) { allInput.value = initial; doSearch(); }
    }
  } catch (e) {}
})();
`;

const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📰</text></svg>');

function renderHead({ title, description = SITE_DESCRIPTION, path = "", image = null, siteUrl }) {
  const url = siteUrl ? `${siteUrl}/${path}` : null;
  const img = safeUrl(image);
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#f2f2f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d0e12" media="(prefers-color-scheme: dark)">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
${url ? `<meta property="og:url" content="${escapeHtml(url)}">\n<link rel="canonical" href="${escapeHtml(url)}">` : ""}
${img ? `<meta property="og:image" content="${escapeHtml(img)}">` : ""}
<link rel="icon" href="${FAVICON}">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="feed.xml">
<script>${HEAD_SCRIPT}</script>
<style>${PAGE_STYLES}</style>`;
}

function renderTopbar(active, { viewToggle = false } = {}) {
  const current = (name) => (active === name ? ' aria-current="page"' : "");
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="topbar">
<a class="brand" href="./"${current("home")}>📰 ${SITE_NAME}</a>
<nav class="tools" aria-label="Site">
<a class="tool" href="search.html" title="Search every day" aria-label="Search every day"${current("search")}>🔎</a>
<a class="tool" href="saved.html" title="Saved articles" aria-label="Saved articles"${current("saved")}>★<span class="count" data-saved-count></span></a>
${viewToggle ? `<button id="view-toggle" class="tool" type="button" aria-label="Compact list view" aria-pressed="false">☰</button>` : ""}
<button id="theme-toggle" class="tool" type="button" aria-label="Toggle dark mode">🌙</button>
</nav>
</header>`;
}

function renderFooter() {
  return `<footer class="site-footer">
<a href="./">All days</a><a href="search.html">Search</a><a href="saved.html">Saved</a><a href="feed.xml">RSS</a>
<span>Tip: press <kbd>/</kbd> to search</span>
</footer>`;
}

function renderCover(a, hue) {
  const img = safeUrl(a.image);
  if (img) {
    return `<img class="cover" src="${escapeHtml(img)}" loading="lazy" decoding="async" alt="">`;
  }
  return `<div class="cover placeholder" aria-hidden="true" style="background: linear-gradient(135deg, hsl(${hue},55%,45%), hsl(${(hue + 40) % 360},55%,30%));">📰</div>`;
}

function renderArticle(a, edition, isoDate) {
  const sourceName = a.sourceLabel || edition.name;
  const hue = hashHue(sourceName + a.headline);
  const emoji = EDITION_EMOJI[sourceName] || "📰";
  const href = safeUrl(a.url) || "#";
  const readTime = a.readTime ? `<span class="readtime">${escapeHtml(a.readTime)}</span>` : "";
  const more = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Read more →</a>`;
  const blurb = `<p class="blurb">${a.blurb ? `${escapeHtml(a.blurb)} ` : ""}${more}</p>`;
  const attrs = [
    `data-url="${escapeHtml(href)}"`,
    `data-headline="${escapeHtml(a.headline)}"`,
    `data-source="${escapeHtml(sourceName)}"`,
    isoDate ? `data-date="${escapeHtml(isoDate)}"` : "",
    safeUrl(a.image) ? `data-image="${escapeHtml(safeUrl(a.image))}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<div class="card" ${attrs}>
    <button class="save" type="button" aria-pressed="false" aria-label="Save for later">☆</button>
    <details>
      <summary>
        <div class="cover-wrap">
          ${renderCover(a, hue)}
          <span class="expand-indicator" aria-hidden="true"></span>
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

function renderEdition(edition, isoDate) {
  const isFeatured = edition.name === "Featured";
  const gridClass = isFeatured ? "grid featured" : "grid";
  const count = edition.sections.reduce((n, s) => n + s.articles.length, 0);
  const sections = edition.sections
    .map(
      (s) =>
        `${isFeatured ? "" : `<h3 class="section">${escapeHtml(s.title)}</h3>\n`}<div class="${gridClass}">\n${s.articles
          .map((a) => renderArticle(a, edition, isoDate))
          .join("\n")}\n</div>`
    )
    .join("\n");
  const emoji = EDITION_EMOJI[edition.name] || "📰";
  const id = slugify(edition.name);

  if (isFeatured) {
    return `<section id="${id}">\n<h2 class="edition featured">${emoji} ${escapeHtml(edition.name)}</h2>\n${sections}\n</section>`;
  }
  // Collapsed by default — with 400+ articles, forcing a linear scroll past
  // everything is the "too much scrolling" problem this layout exists to fix.
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
  return `<nav class="quicknav" aria-label="Topics">\n${allPill}\n${pills}\n</nav>`;
}

// The "All" default view: a tile per topic, using that topic's own top article
// image as the tile background when one's available.
function renderCategoryTile(edition) {
  const emoji = EDITION_EMOJI[edition.name] || "📰";
  const articles = edition.sections.flatMap((s) => s.articles);
  const count = articles.length;
  const withImage = articles.find((a) => safeUrl(a.image));
  const hue = hashHue(edition.name);
  const bg = withImage
    ? `background-image: url('${escapeHtml(safeUrl(withImage.image))}');`
    : `background: linear-gradient(135deg, hsl(${hue},55%,40%), hsl(${(hue + 40) % 360},55%,25%));`;
  return `<a href="#${slugify(edition.name)}" class="category-tile" data-target="${slugify(edition.name)}" style="${bg}">
    <span class="tile-emoji" aria-hidden="true">${emoji}</span>
    <div class="tile-overlay">
      <span class="tile-name">${escapeHtml(edition.name)}</span>
      <span class="tile-count">${count} article${count === 1 ? "" : "s"}</span>
    </div>
  </a>`;
}

function renderCategoryGrid(editions) {
  const tiles = editions
    .filter((e) => e.name !== "Featured")
    .map(renderCategoryTile)
    .join("\n");
  return `<div id="category-grid">\n${tiles}\n</div>`;
}

// editions: [{ name, sections: [{ title, articles: [{headline,url,readTime,blurb,image,sourceLabel}] }] }]
function buildDailyHtml(isoDate, editions, { siteUrl } = {}) {
  const nav = renderQuickNav(editions);
  const grid = renderCategoryGrid(editions);
  const body = editions.map((e) => renderEdition(e, isoDate)).join("\n");
  const total = editions.reduce((n, e) => n + e.sections.reduce((m, s) => m + s.articles.length, 0), 0);
  const featured = editions.find((e) => e.name === "Featured");
  const lead = (featured || editions[0] || { sections: [] }).sections.flatMap((s) => s.articles);
  const image = (lead.find((a) => safeUrl(a.image)) || {}).image;
  const longDate = formatLongDate(isoDate);
  const description = lead.length
    ? `${lead.slice(0, 3).map((a) => a.headline).join(" · ")} — and ${Math.max(total - 3, 0)} more stories.`
    : SITE_DESCRIPTION;
  return `<!doctype html>
<html lang="en">
<head>
${renderHead({ title: `${SITE_NAME} — ${longDate}`, description, path: `${dateToSlug(isoDate)}.html`, image, siteUrl })}
</head>
<body>
${renderTopbar("day", { viewToggle: true })}
<main id="main">
<h1 class="page-title">${escapeHtml(longDate)}</h1>
<p class="subtle">${total} stories across ${editions.filter((e) => e.name !== "Featured").length} topics</p>
<nav class="daynav" data-date="${escapeHtml(isoDate)}" aria-label="Other days">
<a class="older" href="#" hidden>← Older</a>
<a href="./">All days</a>
<a class="newer" href="#" hidden>Newer →</a>
</nav>
<div class="searchbar" role="search">
<label class="sr-only" for="search-input">Search today's articles</label>
<input id="search-input" data-search type="search" placeholder="Search today's articles…  ( / )" autocomplete="off">
<p id="search-count" class="search-count" aria-live="polite"></p>
</div>
${nav}
${grid}
${body}
</main>
${renderFooter()}
<script>${PAGE_SCRIPT}</script>
</body>
</html>`;
}

// Home page: today's digest as a lead story, then every day grouped by month,
// newest first. manifest: [{ date, slug, count, topics, top: [headline], image }], newest first.
function buildIndexHtml(manifest, { siteUrl } = {}) {
  const [latest] = manifest;
  const leadImg = latest && safeUrl(latest.image);
  const lead = latest
    ? `<a class="lead" href="${escapeHtml(latest.slug)}.html">
<div class="lead-image" role="img" aria-label="" ${leadImg ? `style="background-image: url('${escapeHtml(leadImg)}')"` : ""}></div>
<div class="lead-body">
<span class="eyebrow">Latest digest</span>
<h2>${escapeHtml(formatLongDate(latest.date))}</h2>
<ul>${latest.top.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}</ul>
<span class="cta">Read all ${latest.count} stories →</span>
</div>
</a>`
    : `<p class="empty">No digests yet.</p>`;

  const byMonth = [];
  for (const day of manifest) {
    const key = day.date.slice(0, 7);
    if (!byMonth.length || byMonth[byMonth.length - 1].key !== key) byMonth.push({ key, days: [] });
    byMonth[byMonth.length - 1].days.push(day);
  }
  const months = byMonth
    .map(({ key, days }) => {
      const title = formatLongDate(`${key}-01`, { month: "long", year: "numeric" });
      const rows = days
        .map(
          (d) => `<li><a class="day-row" href="${escapeHtml(d.slug)}.html">
<span class="day-date"><b>${Number(d.date.slice(8))}</b><span>${formatLongDate(d.date, { weekday: "short" })}</span></span>
<span class="day-top">${d.top.map(escapeHtml).join(" · ") || "Digest"}</span>
<span class="day-count">${d.count} stories</span>
</a></li>`
        )
        .join("\n");
      return `<section class="month" aria-labelledby="m-${key}">
<h2 id="m-${key}">${escapeHtml(title)}</h2>
<ol class="days" reversed>
${rows}
</ol>
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
${renderHead({ title: `${SITE_NAME} — daily AI, tech & world news`, path: "", image: leadImg, siteUrl })}
</head>
<body>
${renderTopbar("home")}
<main id="main">
<h1 class="sr-only">${SITE_NAME}</h1>
${lead}
<h2 class="sr-only">Archive</h2>
${months}
</main>
${renderFooter()}
<script>${PAGE_SCRIPT}</script>
</body>
</html>`;
}

function buildSearchHtml({ siteUrl } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
${renderHead({ title: `Search every day — ${SITE_NAME}`, path: "search.html", siteUrl })}
</head>
<body>
${renderTopbar("search")}
<main id="main">
<h1 class="page-title">Search every day</h1>
<p class="subtle">Headlines and sources from every digest so far, newest first.</p>
<div class="searchbar" role="search">
<label class="sr-only" for="all-search">Search all digests</label>
<input id="all-search" data-search type="search" placeholder="e.g. GPT, Singapore, ransomware…" autocomplete="off" autofocus>
<p id="all-status" class="search-count" aria-live="polite">Type at least 2 characters.</p>
</div>
<ol id="all-results" class="results"></ol>
</main>
${renderFooter()}
<script>${PAGE_SCRIPT}</script>
</body>
</html>`;
}

function buildSavedHtml({ siteUrl } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
${renderHead({ title: `Saved — ${SITE_NAME}`, path: "saved.html", siteUrl })}
</head>
<body>
${renderTopbar("saved")}
<main id="main">
<h1 class="page-title">Saved for later</h1>
<p class="subtle">Stories you starred with ☆. Kept in this browser only.</p>
<ol id="saved-list" class="results"></ol>
<p id="saved-empty" class="empty">Nothing saved yet. Tap ☆ on any story to keep it here.</p>
</main>
${renderFooter()}
<script>${PAGE_SCRIPT}</script>
</body>
</html>`;
}

function escapeXml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// One RSS item per day, so a feed reader gets one notification per digest rather
// than 400. pubDate is 08:00 Singapore (00:00 UTC), when the digest is scheduled.
function buildFeedXml(manifest, { siteUrl }) {
  const items = manifest
    .map((d) => {
      const link = `${siteUrl}/${d.slug}.html`;
      const desc = `<ul>${d.top.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}</ul><p>${d.count} stories.</p>`;
      return `<item>
<title>${escapeXml(`${SITE_NAME} — ${formatLongDate(d.date)}`)}</title>
<link>${escapeXml(link)}</link>
<guid isPermaLink="true">${escapeXml(link)}</guid>
<pubDate>${new Date(`${d.date}T00:00:00Z`).toUTCString()}</pubDate>
<description>${escapeXml(desc)}</description>
</item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${SITE_NAME}</title>
<link>${escapeXml(siteUrl)}/</link>
<atom:link href="${escapeXml(siteUrl)}/feed.xml" rel="self" type="application/rss+xml"/>
<description>${escapeXml(SITE_DESCRIPTION)}</description>
<language>en</language>
${items}
</channel>
</rss>
`;
}

module.exports = {
  MONTHS,
  dateToSlug,
  slugToIso,
  formatLongDate,
  escapeHtml,
  safeUrl,
  buildDailyHtml,
  buildIndexHtml,
  buildSearchHtml,
  buildSavedHtml,
  buildFeedXml,
};
