# Baseline (before overnight work) — 2026-10-21 00:45 SGT, commit 5dfd975

## Build / tests / lint
- No build step (Node scripts emit static HTML into `docs/`).
- Tests: **none** (`npm test` is the npm placeholder that exits 1).
- Lint/format config: **none**.
- `npm audit`: **1 high** (transitive undici via cheerio) → fixed in 498210e.
- End-to-end `node publish.js` against a fake remote: OK, 426 articles, ~55 s.

## Site (docs/, served by GitHub Pages from main:/docs)
- 101 daily pages (09-july-2026 … 20-october-2026) + `index.html`.
- Daily page 20-october-2026.html: **467,641 bytes**, 297 cards, 250 `<img>`, 47 placeholders.
  - Every card carries its blurb twice (visible text + `data-blurb` attribute for search).
- index.html: 13,434 bytes, unstyled `<ul>` of ISO dates.

## Defects found by inspection
- **Archive order is wrong**: sorted by the `DD-month-YYYY` slug string, so it reads
  31 Jul, 31 Aug, 30 Sep, 30 Jul… instead of newest-first.
- Daily page has **no link to the archive or to the previous/next day** (dead end).
- No `<meta name="description">`, Open Graph tags, favicon, or theme-color.
- Search `<input>` has no label (placeholder only) — fails WCAG 1.3.1/4.1.2.
- Muted text `#767680` on `#f2f2f5` ≈ 4.0:1 → below AA 4.5:1 for small text.
- Theme handled by 3 duplicated rule sets per component (media query, [data-theme=dark],
  [data-theme=light]) — ~60 lines of duplication, easy to get out of sync.
- Raw article data is not kept anywhere: only rendered HTML, so the site can't be
  re-rendered with a new template and there's no cross-day search.

## Lighthouse
Not run: would need a global/npx Chrome tooling download (protocol: no global installs).
Manual audit above stands in for it.

## Screenshots (viewed in the in-app browser, 375px + 800px)
- Daily page: header, search, topic pills, 8 image tiles, Featured grid — solid.
- Archive: plain blue links in wrong order — the weakest page on the site.
