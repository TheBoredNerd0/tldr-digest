# tldr-digest

Scrapes all 14 tldr.tech newsletter editions (Tech, AI, Data, Dev, Design, DevOps,
Marketing, Product, Founders, Infosec, Crypto, Fintech, Hardware, IT — Hardware is
"Launching Soon" upstream and currently returns no content, handled gracefully),
plus Hacker News, The Rundown AI, and 5 world-news outlets (see "Additional sources"
below), and publishes a daily static HTML digest — a Featured front page pinned at
the top, then every source as its own section — with a short Telegram message
linking to it (the full per-article text no longer goes to Telegram — that was the
point, to stop flooding the chat).

## Featured section
`buildFeatured()` in `publish.js` curates a "front page" from across every source —
2 BBC World + 1 Guardian + 1 Al Jazeera (world impact), top 3 Hacker News by score,
the lead story from TLDR Tech/AI, and Rundown AI's top pick — and unshifts it to the
front of the editions list *before* the cross-source dedupe runs, so featured picks
simply don't repeat further down the page. Each featured card keeps its **true**
source badge (`sourceLabel`), not a generic "Featured" tag, via a shallow clone at
pick time — `renderArticle()` in `html.js` prefers `a.sourceLabel` over the
containing edition's name for exactly this reason.

## World news (5 outlets)
Added on request for "impactful news, what's going on around the world" — the
existing sources were all tech/startup-flavored. `sources/worldnews.js` lists 5
official public RSS feeds, each becoming its own edition/section like every other
source (own badge, own emoji), via a shared `sources/rss.js` helper:
- **BBC World**, **Guardian World**, **NYT World**, **NPR World** — mainstream
  Western coverage, all with real headlines/descriptions; BBC/Guardian/NYT also
  carry `media:content`/`media:thumbnail` images directly in the feed (no extra
  fetch needed), NPR doesn't (falls back to `attachImages()`'s og:image scrape).
- **Al Jazeera** — added deliberately for actual perspective diversity, not just
  more Western headlines saying the same thing about the same stories; no feed
  image, relies on the og:image fallback.
- Checked and skipped: **Reuters** (public RSS discontinued, 404), **AP News** (no
  real RSS, just an HTML page). **NewsAPI.org**/**GNews** would need an API key
  handed over by the user and NewsAPI's free tier explicitly bars production use
  per their ToS, so didn't pursue either without checking with the user first.
- `sources/rss.js`'s `stripHtml()` matters here: the Guardian wraps its
  `<description>` in nested `<p>` tags, and cheerio's plain `.text()` concatenates
  adjacent block elements with **no separator**, producing glued-together text
  ("corruptionA fictitious..."). Fixed by extracting text per block element and
  joining with a space.

## Additional sources
Added on request for "combine everything into the ultimate newsletter." Researched
several candidates (Techmeme, Hacker Newsletter, Pragmatic Engineer, The Rundown AI,
Hacker News) and only added the two that were cleanly scrapeable without fighting a
JS-only SPA or a stale/dead HTML shell:
- `sources/hackernews.js` — official HN Firebase API (`hacker-news.firebaseio.com`),
  top 15 stories. No HTML scraping at all, so it's the most robust source in this
  project — structured JSON, official, stable.
- `sources/rundown.js` — therundown.ai's `/archive` is server-rendered (beehiiv),
  unlike most newsletter sites which only render their post list client-side. Scrapes
  the archive for post links, then each post's meta description + og:image.
- Skipped: **Techmeme** (obfuscated/minified CSS classes, would need real reverse-
  engineering to parse reliably), **Hacker Newsletter** (homepage is a stale ~2015-era
  marketing shell, not the actual current issue archive), **Pragmatic Engineer**
  (weekly long-form essays, doesn't fit a daily quick-digest card format, largely
  paywalled).
- All sources feed into the same cross-source dedupe (see below) and image pipeline,
  so an HN story that's also an og:image-bearing article gets a cover image too.

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
- `html.js` — renders one full digest page per day as a Flipboard-style card grid:
  each article is a `<details>/<summary>` card (cover image + headline only, native
  click-to-expand reveals the blurb — no JS needed) plus the archive index page.
  Articles with no scrapeable image get a deterministic gradient placeholder instead
  of a broken `<img>`.
- `scrape.js` also has `attachImages()` — best-effort og:image/twitter:image scrape
  of each article's *own* target site (tldr.tech's pages carry no images at all).
  Concurrency-limited (10 at a time), silently skips sites that block/timeout — real
  hit rate is roughly two-thirds of articles, rest fall back to the placeholder.
- `publish.js` — the production entry point: scrapes all TLDR editions + the extra
  sources, **dedupes articles by URL across every source** (TLDR itself cross-posts
  big stories to multiple editions, which read as repeats once everything is stacked
  on one page — first occurrence wins, later ones dropped), fetches images, writes
  today's HTML + refreshes the index, `git add/commit/push`es `docs/` (GitHub Pages
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
