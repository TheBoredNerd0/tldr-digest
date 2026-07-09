# tldr-digest

Scrapes all 14 tldr.tech newsletter editions (Tech, AI, Data, Dev, Design, DevOps,
Marketing, Product, Founders, Infosec, Crypto, Fintech, Hardware, IT — Hardware is
"Launching Soon" upstream and currently returns no content, handled gracefully) and
publishes a daily static HTML digest, with a short Telegram message linking to it
(the full per-article text no longer goes to Telegram — that was the point, to stop
flooding the chat).

## Live
- Site: https://theborednerd0.github.io/tldr-digest/ (GitHub Pages, `docs/` on `main`)
- Repo: https://github.com/TheBoredNerd0/tldr-digest (public — required for free-tier
  GitHub Pages, same reason expense-tracker was briefly made public; no sensitive data
  here so kept public, unlike expense-tracker)
- Daily file: `docs/DD-month-YYYY.html` (e.g. `09-july-2026.html`), plus `docs/index.html`
  listing all days, newest first.

## How it works
- `scrape.js` — fetches `https://tldr.tech/api/latest/{slug}` (server-renders the
  latest edition directly; the plain `/{slug}` landing page doesn't expose dated
  archive links for most editions, only `tech` happened to). Parses `<section>` /
  `<article>` blocks into `{ headline, url, readTime, blurb }`, skipping sponsor slots.
- `html.js` — renders one full digest page per day (all editions, all sections) plus
  the archive index page.
- `publish.js` — the production entry point: scrapes all editions, writes today's
  HTML + refreshes the index, `git add/commit/push`es `docs/` (GitHub Pages
  auto-rebuilds on push, no separate deploy step), then sends **one short Telegram
  message** with the day's link — not the full digest text.
- `send.js` — posts directly to the Telegram Bot API using the token already at
  `~/.claude/channels/telegram/.env` (`TELEGRAM_BOT_TOKEN`). Deliberately does **not**
  shell out to a nested `claude` process or go through the MCP plugin, to stay clear
  of the bot's polling lock.
- `scheduler.js` — this container has no system cron, and the `/schedule` skill's
  cloud routines run in an isolated Anthropic cloud sandbox with no access to this
  container's filesystem, git credentials, or the bot token, so neither fit. Instead
  this is a plain Node loop that sleeps until the next 08:00 Asia/Singapore (fixed
  00:00 UTC, no DST) and runs `publish.js`, forever. Launched detached in its own
  tmux session (`tldr-digest-scheduler`), same pattern the Telegram bot itself
  already uses to survive across turns. **This means the digest only keeps firing as
  long as this container stays up** — same durability ceiling the Telegram bot
  already has.

## Earlier iterations (kept working, no longer scheduled)
- `format.js` / `index.js` — the original design: one Telegram message per edition
  (newsletter-style, all sections in one message — an earlier version sent one
  message *per section*, five per edition, which is what prompted the "flooding the
  chat" complaint that led to the HTML site instead). `state.json` tracks
  already-sent article URLs per edition so `index.js --send` reruns only deliver new
  stories. Still usable manually (`node index.js --editions=tech,ai` for a dry run),
  just not what the daily scheduler calls anymore.
- First attempt at hosting used Cloudflare Pages with a guessed `pages.dev` URL that
  was never actually connected — sent the user a dead link before verifying it
  resolved. Caught and fixed same session; switched to GitHub Pages per the user's
  preference (fewer steps: `gh api .../pages` + public repo, vs. a manual Cloudflare
  dashboard connection or handing over a Cloudflare API token).

## Manual usage
```
node publish.js                     # scrape everything, publish site, send Telegram link
node index.js --editions=tech,ai    # old flow: dry run, no send
node index.js --send                # old flow: full-text digest per edition to Telegram
tmux attach -t tldr-digest-scheduler # check on the daemon
```
