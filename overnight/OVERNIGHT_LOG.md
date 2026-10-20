# Overnight log

SESSION START: 2026-10-21 00:39 SGT (branch `overnight/2026-10-21`)

Ground rules for this run: work only on `overnight/*` branches. GitHub Pages serves
`main:/docs`, so nothing here reaches the live site until the human merges.

## 00:40–00:52 Recon, baseline, research
- What this project is: a daily news digest for one reader (the owner, in Singapore).
  GitHub Actions scrapes 14 TLDR editions + ~16 RSS/HTML sources at 08:00 SGT, dedupes,
  groups by topic, renders a static card page into `docs/` (GitHub Pages), and sends a
  Telegram link. The owner cares most about AI model news + GitHub repos (Featured).
- Baseline: no tests/lint; npm audit 1 high (fixed, 498210e); archive order broken;
  day pages are dead ends. See before-after/BASELINE.md.
- Research: 20 sources incl. NN/g, HN Show HN feedback, AIBriefs, Techmeme, TLDR,
  Kagi Kite, CN design writing, arXiv. Plan in research/REDESIGN_PLAN.md.

## 00:52–01:12 Build
- 498210e npm audit fix. 95c0975 Telegram chunk overflow fix.
- 1d6bcec data layer (site.js) + template rewrite (html.js) + tests (28) + scripts.
- 6e3aab3 fresher archive rows, search hand-off, deterministic short dates.
- d5c74be backfilled 100 days (counts match originals) and rebuilt the site.
- CI workflow, README, PROGRESS entry; dead-image fallback.
- Verified in browser: home, day page (cards + compact + dark), search-all
  ("claude opus" → 14 hits), save → Saved page → remove, "/" + Escape,
  prev/next links, ?q= hand-off. Contrast: all text ≥ 4.63:1.
- E2E publish against a fake remote: commit touches 6 files; Telegram 401 as
  expected with a dummy token.

## 01:12–01:32 More features, hardening, verification
- Unread/visited marks on the archive; shared versioned CSS/JS assets (−15% page).
- Repeat detection: 37.5% of stories repeat day-over-day (60% weekends) →
  "also the day before" tags, "N new", "Show new only", tile new-counts.
- j/k/o/s reader keys. Source-health tracking (missingSources + Actions warnings).
- Atom feed support. Six extra AI sources on branch overnight/feature-more-ai-sources.
- Rehearsed the main-merge procedure in a scratch clone (conflict + clean cases).
- jsdom client tests (45 total). Daily workflow installs prod deps only.
- Washington Post feeds host returns 502 for every feed (outage on their side).
