# tldr-digest

Scrapes all 14 tldr.tech newsletter editions (Tech, AI, Data, Dev, Design, DevOps,
Marketing, Product, Founders, Infosec, Crypto, Fintech, Hardware, IT — Hardware is
"Launching Soon" upstream and currently returns no content, handled gracefully) and
sends a consolidated newsletter-style digest per edition to Telegram, once daily.

## How it works
- `scrape.js` — fetches `https://tldr.tech/api/latest/{slug}` (server-renders the
  latest edition directly; the plain `/​{slug}` landing page doesn't expose dated
  archive links for most editions, only `tech` happened to). Parses `<section>` /
  `<article>` blocks into `{ headline, url, readTime, blurb }`, skipping sponsor slots.
- `format.js` — builds one Telegram MarkdownV2 message per edition (not per section —
  the original per-section design produced 5 messages per edition and was reported as
  spammy). Splits into multiple parts only if the whole edition exceeds Telegram's
  4096-char limit.
- `state.json` — tracks already-sent article URLs per edition so reruns only deliver
  new stories.
- `send.js` — posts directly to the Telegram Bot API using the token already at
  `~/.claude/channels/telegram/.env` (`TELEGRAM_BOT_TOKEN`). Deliberately does **not**
  shell out to a nested `claude` process or go through the MCP plugin, to stay clear
  of the bot's polling lock.
- `scheduler.js` — this container has no system cron, and the `/schedule` skill's
  cloud routines run in an isolated Anthropic cloud sandbox with no access to this
  container's filesystem or the bot token, so neither fit. Instead this is a
  plain Node loop that sleeps until the next 08:00 Asia/Singapore (fixed 00:00 UTC,
  no DST) and runs `index.js --send`, forever. Launched detached in its own tmux
  session (`tldr-digest-scheduler`), same pattern the Telegram bot itself already
  uses to survive across turns. **This means the digest only keeps firing as long as
  this container stays up** — same durability ceiling the Telegram bot already has.

## Manual usage
```
node index.js --editions=tech,ai   # dry run, no send
node index.js --send               # send all new articles across all editions
tmux attach -t tldr-digest-scheduler   # check on the daemon
```
