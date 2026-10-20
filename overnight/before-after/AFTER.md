# After (branch overnight/2026-10-21) vs baseline

| Metric | Before (main @ 5dfd975) | After | Change |
|---|---|---|---|
| Automated tests | 0 (`npm test` exited 1) | **53 passing** (node:test + jsdom), CI on push | new |
| npm audit | 1 high (undici) | 0 | fixed |
| Day page 20 Oct (raw) | 462,386 B | 391,595 B | **−15%** |
| Day page 20 Oct (gzip) | 77,961 B | 72,428 B | −7% |
| CSS + JS per page view | 0 extra (inlined in every page) | 35 KB, fetched once and cached for all pages | repeat visits are cheaper |
| Home page | unstyled list, **wrong order** (31 Jul above 20 Oct) | latest digest lead + month archive, newest first, unread marks | fixed |
| Day → other days | dead end | ← older · All days · newer → | new |
| Search | today's page only | today's page + every day (`search.html`) | new |
| Saved / RSS / compact view / keys | none | ☆ Saved page, `feed.xml`, compact list, `/` `j` `k` `o` `s` | new |
| Repeated stories | not visible (37.5% of stories repeat from the day before) | tagged; "N new since the day before"; "Show new only" | new |
| Silent source failures | invisible (Rundown + VentureBeat gone ~2 months) | per-day `missingSources`, page footer, Actions warnings | new |
| Dead cover images | blank boxes (~8% on old days) | gradient placeholder | fixed |
| Muted-text contrast | 4.02:1 (fails AA) | 5.91:1 light / 7.45:1 dark | fixed |
| Search input label | none | `<label>` + `role="search"` | fixed |
| Meta / OG / favicon / RSS link | none | all present | new |
| Telegram legacy formatter | could exceed 4096 chars and fail | split per article | fixed |
| Raw data kept | none (HTML only) | `data/days/*.json` for all 101 days | new |

Lighthouse was not run: it needs a global Chrome/npx tooling download, which the
protocol rules out. I checked by hand instead: contrast ratios computed (all text ≥
4.63:1), no horizontal scroll at 375px, labelled controls, focus rings, reduced motion.

Visual checks were done at 375px and at desktop width, light and dark, in cards and compact view.
