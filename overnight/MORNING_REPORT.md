# Morning report: tldr-digest overnight run

## TL;DR
- **Your Telegram digest stopped on 19 July because the `TELEGRAM_BOT_TOKEN` secret is
  missing.** The site kept publishing every day. Adding the secret is the one thing only
  you can do (see *Needs your decision* #1).
- The website got a full overhaul on branch **`overnight/2026-10-21`**:
  - the archive order is fixed, with a new home page;
  - new: previous/next day, search across every day, ☆ Saved, compact view, muted
    words, share, keyboard keys and RSS;
  - "Show new only" hides the ~37% of stories that just repeat the day before.
- Every day's news is now stored as data (`data/days/*.json`), so the whole site can be
  regenerated, and the 100 past days were recovered from their HTML.
- Sources that silently die are now flagged: The Rundown AI and VentureBeat had been
  missing for ~2 months unnoticed (both fixed yesterday).
- Went from **0 to 53 automated tests** (57 with the optional branches), plus CI. npm audit is clean. Today's page is 15%
  lighter. Nothing is live until you merge (a merge procedure is in NEEDS_HUMAN, rehearsed twice).

## Time
- Start 2026-10-21 00:39 SGT. Report written ~01:40; work continued after (see log).

## Branches
| Branch | What |
|---|---|
| `overnight/2026-10-21` | Everything below. Based on `main` @ 5dfd975. |
| `overnight/feature-more-ai-sources` | On top of the above: six more AI sources. Your call. |
| `overnight/feature-story-clusters` | On top of the above: one card per story across outlets, with "Also covered by…". Your call. |
| `overnight/feature-telegram-headlines` | On top of the above: the Telegram message adds "N new" + the top 3 headlines. Your call. |

Nothing was pushed to `main`, and nothing was deployed.

## What I fixed
- **Archive order**: the old index sorted "DD-month-YYYY" strings, so 31 Jul was listed above 20 Oct.
- **Dead ends**: day pages had no link to other days.
- **Telegram legacy formatter** could build >4096-char messages, which Telegram rejects.
- **npm audit**: 1 high (undici) → 0.
- **Dead cover images** (~8% on older days) showed as blank boxes; now a placeholder.
- **Accessibility**: muted text contrast 4.0 → 5.9:1, labelled search, focus rings,
  skip link, reduced motion.
- **Safety**: scraped URLs limited to http(s) before going into href/src/CSS; quotes escaped.
- **Date formatting** no longer depends on the machine's ICU data, so every rebuild is
  byte-identical.

## What I built
- **Data layer** (`site.js`): one JSON per day. Pages, archive, search index and RSS are
  all generated from it. `npm run rebuild` re-renders all 100+ days in ~3 s.
- **Home**: latest-digest lead card and a month-grouped archive with each day's *new*
  headlines; days you haven't opened are highlighted.
- **Day page**: ← older / newer →, "N new since the day before" + *Show new only*,
  ☆ save, Share/Copy link, compact list view, muted words, `/` `j` `k` `o` `s` keys,
  `#topic` deep links, missing-source note in the footer.
- **Search every day** (`search.html`) and **Saved** (`saved.html`) pages; **RSS** (`feed.xml`).
- **Source health**: the run records sources with zero articles and warns in Actions
  (louder at 3 days in a row).
- **Atom feed support** (opens up The Verge, Simon Willison and similar feeds).
- **Shared versioned CSS/JS** instead of inlining in every page.
- **Tests + CI**: 53 tests (pipeline, site, templates, network stubs, and the real page
  script in jsdom); `.github/workflows/test.yml`. README rewritten.

## Before → after
See `overnight/before-after/BASELINE.md` and `AFTER.md`. Highlights: tests 0 → 53,
audit 1 high → 0, day page 462 KB → 392 KB, contrast 4.02 → 5.91:1, and new archive,
search, saved, repeats and health features.

## Research highlights
Files are in `overnight/research/`. ~25 sources across NN/g, HN Show HN feedback,
AIBriefs, Techmeme, TLDR archives, Kagi Kite, KBlip, Chinese design writing (人人都是产品经理,
优设, 即时设计), W3C APG and arXiv. Reddit was skipped because of its login wall.
1. Lists scan faster than cards (NN/g), so I added the compact view.
2. HN readers of a similar AI digest asked for a dense view, keyboard paging and RSS,
   and criticised "generic AI-made UI". I added all three and kept the existing look.
3. Every strong competitor has saved items and archive navigation.
4. Kagi's open-source Kite is a static site over daily JSON. That confirmed the data-layer design.
5. Techmeme-style story clustering was the biggest gap, so I built it on a branch: ~7.5
   duplicate stories a day folded, with no unrelated merges in a 25-group hand check.

## Needs your decision (details in `NEEDS_HUMAN.md`)
1. Add the `TELEGRAM_BOT_TOKEN` secret.
2. Merge `overnight/2026-10-21` → `main`. The exact, rehearsed commands are there.
   Expect one harmless conflict in `docs/index.html`.
3. Three optional branches: six more AI sources, cross-outlet story folding, and
   headlines in the Telegram message. Merge any of them; all three together merge
   cleanly and pass 57/57 tests.
4. The Washington Post feed host has been down (502) since 21 Oct. Watch the new warnings.
5. Keep or delete the legacy per-edition Telegram flow.
6. Optional paid AI daily summary.

## What I'd do next
See `ROADMAP_SUGGESTIONS.md`: secret + merge, AI sources, story clustering, top
headlines in the Telegram message, GitHub Trending repeat filtering.

## How to review
```bash
cd C:\CLAUDE\tldr-digest
git log --oneline main..overnight/2026-10-21
git checkout overnight/2026-10-21
npm ci
npm test
npm run preview
```
Then open http://localhost:8080/tldr-digest/ and look at the home page, a day page (try *Show new
only*, ☰ and `j`/`k`), `search.html?q=claude`, and ☆ → Saved. Without a server, opening
`docs/index.html` directly also works, but prev/next and search need it served.
