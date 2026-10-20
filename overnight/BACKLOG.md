# Backlog

Legend: [ ] todo · [~] in progress · [x] done · [!] needs human

## P0 — broken / security
- [x] npm audit high (undici) — 498210e
- [x] Archive sorted by slug string instead of date
- [x] Daily pages are dead ends: no archive / prev / next links

## P1 — clearly valuable, low risk
- [x] Test harness (node:test, zero deps) + tests for parseEdition, slug/date helpers,
      dedupe, mergeEditions, escapeHtml, MarkdownV2 escaping, archive ordering
- [x] Make publish.js importable (pure helpers out of the side-effecting script)
- [x] Save each day's raw data as JSON (docs/data/YYYY-MM-DD.json) so pages can be
      re-rendered and searched across days; backfill from the 101 existing HTML pages
- [x] Redesigned home page: open today's digest, month-grouped archive, newest first
- [x] Accessibility: search label, contrast to AA, focus-visible rings, reduced motion,
      skip link, aria-pressed on theme toggle
- [x] SEO/meta: description, OG tags, favicon, theme-color
- [x] CSS tokens: collapse the triplicated light/dark rules into custom properties
- [x] Drop duplicate `data-blurb` payload (search the card text instead) — page weight

## P2 — improvements
- [x] Cross-day search page (uses docs/data JSON)
- [x] Saved/bookmarked articles (localStorage) + Saved view
- [x] Re-render all past pages with the new template (from backfilled JSON)
- [x] Keyboard shortcut: "/" focuses search
- [x] RSS feed of the digest itself (docs/feed.xml)
- [ ] Washington Post feed: track whether 502 persists (transient so far)
- [x] README.md (setup, architecture, how to run, secrets)

## P3 — nice to have
- [x] Architecture doc with Mermaid diagram
- [ ] ROADMAP_SUGGESTIONS.md
- [ ] [!] Remove legacy per-edition Telegram flow (index.js, format.js, state.js,
      scheduler.js) — superseded by publish.js + Actions; human decides

## Added during the run
- [x] Legacy Telegram formatter overflowed 4096 chars on long sections (95c0975)
- [x] Archive rows repeated identical headlines over weekends (6e3aab3)
- [x] Dead hotlinked cover images showed as blank boxes (~8% on old days)
- [x] CI workflow running npm test on push/PR
- [ ] Compact-view preference also on the home page? (no cards there — n/a)
- [ ] .gitattributes to stop CRLF churn on Windows checkouts
- [ ] Mobile pass on new pages (home lead card, search, saved)
