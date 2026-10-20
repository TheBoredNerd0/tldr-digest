# Roadmap suggestions (ranked)

Each item says why, and what it would take.

1. **Add the Telegram secret + merge** (NEEDS_HUMAN #1, #2). Nothing below matters
   until the link reaches your phone and the new site is live.
2. **More AI sources** (`overnight/feature-more-ai-sources`, ready to merge). You said
   AI model news and GitHub repos matter most. This adds 6 tested AI feeds and gives
   Verge AI and Simon Willison a Featured slot each.
3. **Story clustering across outlets.** Techmeme's best feature is grouping one story's
   coverage ("More: Reuters, Verge, …"). Today identical *URLs* are deduped, but the same
   story from BBC, Guardian and Al Jazeera shows three times. A cheap first version
   groups headlines with high word overlap, without an LLM. Medium effort.
4. **Telegram message with the top 3 headlines**, not just the link (TLDR archives title
   each issue by its top stories, and so does our new archive). One line in `publish.js`,
   using `summarizeDay().top`.
5. **AI "what mattered today" paragraph** (NEEDS_HUMAN #6). Needs an API key and a
   small daily cost.
6. **GitHub Trending upgrades**: show stars gained today and the repo language as chips;
   filter out repos already featured in the last 7 days (repeats are common).
7. **Smaller search index**: drop `https://` prefixes and the topic column (~25%), or
   build per-month trigram indexes if search ever feels slow. Today it's ~6 MB raw,
   about 1.5 MB gzipped, loaded only when you search.
8. **Prune or gzip old data** once the repo passes a few hundred MB (years away).
9. **Remove the legacy Telegram flow** (NEEDS_HUMAN #5) to shrink the codebase ~20%.
10. **Offline/PWA**: a manifest + service worker would let the day's digest open
    without signal (useful on the MRT). Small effort, but it's a new moving part.
