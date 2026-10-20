# Backlog

Legend: [ ] todo · [~] in progress · [x] done · [!] needs human

## P0 — broken / security
- [x] npm audit high (undici) — 498210e
- [ ] Archive sorted by slug string instead of date
- [ ] Daily pages are dead ends: no archive / prev / next links

## P1 — clearly valuable, low risk
- [ ] Test harness (node:test, zero deps) + tests for parseEdition, slug/date helpers,
      dedupe, mergeEditions, escapeHtml, MarkdownV2 escaping, archive ordering
- [ ] Make publish.js importable (pure helpers out of the side-effecting script)
- [ ] Save each day's raw data as JSON (docs/data/YYYY-MM-DD.json) so pages can be
      re-rendered and searched across days; backfill from the 101 existing HTML pages
- [ ] Redesigned home page: open today's digest, month-grouped archive, newest first
- [ ] Accessibility: search label, contrast to AA, focus-visible rings, reduced motion,
      skip link, aria-pressed on theme toggle
- [ ] SEO/meta: description, OG tags, favicon, theme-color
- [ ] CSS tokens: collapse the triplicated light/dark rules into custom properties
- [ ] Drop duplicate `data-blurb` payload (search the card text instead) — page weight

## P2 — improvements
- [ ] Cross-day search page (uses docs/data JSON)
- [ ] Saved/bookmarked articles (localStorage) + Saved view
- [ ] Re-render all past pages with the new template (from backfilled JSON)
- [ ] Keyboard shortcut: "/" focuses search
- [ ] RSS feed of the digest itself (docs/feed.xml)
- [ ] Washington Post feed: track whether 502 persists (transient so far)
- [ ] README.md (setup, architecture, how to run, secrets)

## P3 — nice to have
- [ ] Architecture doc with Mermaid diagram
- [ ] ROADMAP_SUGGESTIONS.md
- [ ] [!] Remove legacy per-edition Telegram flow (index.js, format.js, state.js,
      scheduler.js) — superseded by publish.js + Actions; human decides
