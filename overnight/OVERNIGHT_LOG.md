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
