# Redesign plan

Keep what works (the user shaped the daily page over many iterations: topic tiles,
Featured, search, dark mode, read-state). Fix what's broken and add the features the
research shows every strong competitor has.

1. **Data layer**: `docs/data/<iso>.json` per day (Kite-style). Backfill from existing HTML.
   Enables re-rendering, cross-day search, RSS. *Why:* without it nothing below scales.
2. **Home page = today's front page + archive** (NN/g homepage guideline; ui-patterns archive):
   lead card for today, then month-grouped newest-first archive; each day shows its top
   headlines (TLDR archive naming) instead of a bare date.
3. **Day navigation**: ← previous · archive · next → on every day page (no dead ends).
4. **Compact list mode** toggle, remembered per browser (NN/g lists scan better; HN asked).
5. **Saved**: ☆ on every card, Saved page listing saved items across days (AIBriefs, Feedly).
6. **Search all days** page, "/" shortcut to focus search (AIBriefs ⌘K; HN keyboard asks).
7. **RSS feed** of the digest (HN asked; Techmeme/TLDR have it).
8. **Tokens & a11y**: CSS custom properties for light/dark, AA contrast, focus-visible,
   labelled search, reduced motion, skip link.
9. **SEO/meta**: description, OG, favicon, theme-color, canonical.
10. **Weight**: drop the duplicate `data-blurb` attribute (search reads card text).

Out of scope tonight (taste/cost decisions → NEEDS_HUMAN): AI daily summary (paid API),
removing legacy Telegram flow, renaming the site.
