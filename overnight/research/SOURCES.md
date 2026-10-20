# Sources visited (2026-10-21, ~00:44–00:50 SGT)

Raw page text for every read is saved under `C:\CLAUDE\Scraper\output\20261021-*` (outside the repo).

| URL | Learned | Status |
|---|---|---|
| readless.app/blog/best-news-aggregators-2026 | 4 aggregator types: mainstream, bias, RSS, AI digest. Techmeme = "shared front page" | ok |
| techmeme.com | Text-first river; headline + source + "More:" cluster of other outlets | ok |
| tldr.tech/ai/archives | Archive = newest-first list, each issue named by its top 3 headlines + emoji | ok |
| aibriefs.news (+ screenshot) | Saved page, Ctrl+K search, list/grid/compact density toggle, type filters, share, bookmark | ok |
| news.ycombinator.com/item?id=49550515 | Show HN feedback on AIBriefs (see COMPETITORS) | ok |
| kblip.com/releases | Bulleted one-line releases with type emoji (News/Tool/Capability) | ok |
| ui-patterns.com/patterns/Archive | Chronological archive; group by period sized to volume; links must work without JS | ok |
| nngroup.com/articles/cards-component | Lists are more scannable than cards; cards fit heterogeneous content | ok |
| nngroup.com/articles/how-users-read-on-the-web | 79% scan; scannable layout +47% usability | ok |
| nngroup.com/articles/layer-cake-pattern-scanning | Clear chunk headings enable layer-cake scanning | ok |
| nngroup.com/articles/first-2-words-a-signal-for-scanning | First ~11 chars of a headline carry the signal | ok |
| nngroup.com/articles/113-design-guidelines-homepage-usability | Homepage = newspaper front page; logo top-left links home | ok |
| github.com/kagisearch/kite-public | Static front end over daily JSON; once-a-day, "5-minute news diet"; keyword content filters | ok |
| woshipm.com/pd/446701.html, uisdc.com/designing-card-based-user-interfaces | (CN) cards: chunking, image-led, keep one typeface, contrast | ok |
| js.design/special/article/news-listing-page-design.html | (CN) news list pages: categories + favourites tab + search in bottom bar | ok |
| arxiv search "news reading behavior headline skimming" | Headline framing shapes behaviour; headlines are the most-read part | ok |
| behance.net search | Login-gated content | skipped (blocked) |
| ux.stackexchange.com/q/112946 | Page error | skipped |
| baidu image search | CAPTCHA | skipped (no bypass) |
| dribbble.com/search/news-aggregator | Shot titles only; nothing actionable without opening shots | low value |

Saturation: design-pattern queries began returning the same NN/g + listicle sites by the
third query; HN "Show HN digest" saturated after one page (7 items, 2 relevant).

## Round 2 (01:32 SGT)
| URL | Learned | Status |
|---|---|---|
| old.reddit.com/r/rss/search.json | — | **skipped: login wall** (Reddit now requires an account for old.reddit / .json) |
| HN Algolia "TLDR newsletter" | Mostly launch/stat posts; no recurring complaint threads | ok, low signal |
| HN item 48886741 (Ask HN: flag AI-generated articles) | Readers want labels/filters on low-quality/AI-generated content | ok → mute/filter idea in ROADMAP |
| w3.org/WAI/ARIA/apg/patterns/disclosure | Native details/summary already satisfies disclosure keyboard + state semantics | ok, confirms card markup |
| Search engines (bing, brave) | Rate-limited / cooling down | skipped (no evasion) |

Saturation: with Reddit gated and two engines rate-limited, further general web
queries returned only already-recorded domains (NN/g, listicles, CSDN) — stopped.
