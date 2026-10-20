# Needs a human decision

Most important first.

## 1. Add the TELEGRAM_BOT_TOKEN repo secret (blocks Telegram delivery)
- Context: every scheduled run since 2026-07-19 failed at the Telegram step. The site
  itself kept publishing. The secret was almost certainly never added after the
  move to GitHub Actions.
- Do: @BotFather → `/mybots` → the bot that has your old "📰 TLDR Digest" messages →
  API Token. Then go to https://github.com/TheBoredNerd0/tldr-digest/settings/secrets/actions,
  add **New repository secret** named `TELEGRAM_BOT_TOKEN`, and click
  Actions → Daily TLDR Digest → **Run workflow**.
- If it still fails, the run's summary page now shows the Telegram error as an
  annotation, so no sign-in is needed to read it.

## 2. Merge `overnight/2026-10-21` into `main` (makes the new site live)
- Context: GitHub Pages serves `main:/docs`, so nothing from tonight is live yet.
  The 08:00 SGT run on 21 Oct will commit `docs/21-october-2026.html` and a
  new `docs/index.html` to `main` with the old template. Merging will therefore
  conflict on `docs/index.html`. That's expected and safe.
- Recommended (run in `C:\CLAUDE\tldr-digest`):
  ```bash
  git checkout main
  git pull
  git merge overnight/2026-10-21 -m "Merge overnight work"
  git checkout --theirs docs/index.html
  npm ci
  npm run backfill
  npm run rebuild
  npm test
  git add -A
  git commit -m "Merge overnight work and rebuild site"
  git push
  ```
  The merge will stop with `CONFLICT ... docs/index.html`. That's expected, so keep
  going with the next lines. `--theirs` keeps the overnight branch's index.html.
  `backfill` turns any days published on main in the meantime (e.g. 21 Oct) into
  data, and `rebuild` re-renders everything with the new template.
  **Rehearsed tonight** in a scratch clone, both with that conflict and with
  a merge that went through cleanly: 101 days, 34/34 tests pass.
- Options: A) merge as above (recommended). B) Open a PR from the branch first to
  review the diff on GitHub. C) Don't merge; cherry-pick only the
  `fix:` commits.

## 3. Six more AI sources? (branch `overnight/feature-more-ai-sources`)
- Adds The Verge AI, Ars Technica AI, The Decoder, Simon Willison, Latent Space and
  Import AI (all test-fetched tonight and updated within the last day), plus one
  Featured slot each for Verge and Simon Willison. That's about 60 more stories a day in
  the AI tile.
- Why I didn't just do it: what goes in the digest is your editorial call.
- Merge after #2 with `git merge overnight/feature-more-ai-sources` if you want it.

## 3b. Fold the same story from several outlets? (branch `overnight/feature-story-clusters`)
- Techmeme-style: when BBC, NYT and DW all run the same story, keep one card with
  "Also covered by NYT World, DW" links. About 7.5 duplicates are folded per day.
  A hand check of 25 groups found no unrelated stories merged (1 was the same
  event from a different angle).
- Why a branch: it hides cards, so it's a taste call. It only changes rendering,
  and the data is untouched, so removing it later is just a rebuild.

## 3c. Put the top 3 headlines in the Telegram message? (branch `overnight/feature-telegram-headlines`)
- Today's message is title + counts + link. This version adds "· N new" and the day's
  three freshest headlines as bullets, so it's still short.
- Why a branch: you cut the message down to just a link once before, to stop it
  flooding the chat.

All three optional branches merge cleanly on top of #2 (checked together: 57/57 tests).
Pick any of them:
`git merge overnight/feature-story-clusters overnight/feature-more-ai-sources overnight/feature-telegram-headlines`,
then `npm run rebuild`.

## 4. Washington Post World feed is down
- `feeds.washingtonpost.com` returns 502 for every feed tonight (world, national).
  It worked until 20 Oct. It's probably temporary, and the run now retries once and
  flags it as "missing" on the page and in Actions.
- If it's still missing in a week (Actions shows a "missing 3+ days in a row"
  warning), replace it or drop it.

## 5. Legacy Telegram flow (`index.js`, `format.js`, `state.js`, `scheduler.js`)
- Superseded by `publish.js` + Actions and not scheduled anywhere. I fixed a
  real overflow bug in `format.js` but left the files in place.
- Options: A) delete them (less to maintain). B) keep them as a manual fallback
  (current state).

## 6. Optional: an AI-written "what mattered today" summary
- Competitors (AIBriefs, Readless, Kagi News) lead with a short synthesized summary.
  It would need an Anthropic API key as a repo secret and costs a little per day.
  I didn't build it because of the cost rule.

## 7. Repo growth (FYI)
- `docs/` is ~60 MB and `data/` ~22 MB after 100 days. Growth is ~0.7 MB a day,
  ~250 MB a year, which is well within GitHub limits for years. If it ever matters:
  gzip `data/days/*.json`, or prune day pages older than a year (the data stays).
