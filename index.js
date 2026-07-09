const { EDITIONS } = require("./editions");
const { fetchEdition } = require("./scrape");
const { buildEditionDigest } = require("./format");
const { loadState, saveState, markSent, alreadySent } = require("./state");
const { sendTelegramMessage } = require("./send");

const CHAT_ID = process.env.TLDR_DIGEST_CHAT_ID || "370423423";

function parseArgs(argv) {
  const args = { send: false, editions: null };
  for (const arg of argv) {
    if (arg === "--send") args.send = true;
    else if (arg.startsWith("--editions=")) {
      args.editions = arg.slice("--editions=".length).split(",");
    }
  }
  return args;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const editions = args.editions
    ? EDITIONS.filter((e) => args.editions.includes(e.slug))
    : EDITIONS;

  const state = loadState();
  let totalNew = 0;

  for (const edition of editions) {
    let data;
    try {
      data = await fetchEdition(edition.slug);
    } catch (err) {
      console.error(`[${edition.slug}] fetch failed: ${err.message}`);
      continue;
    }

    const newSections = data.sections
      .map((section) => ({
        title: section.title,
        articles: section.articles.filter((a) => !alreadySent(state, edition.slug, a.url)),
      }))
      .filter((section) => section.articles.length > 0);

    if (newSections.length === 0) continue;

    const newArticleCount = newSections.reduce((n, s) => n + s.articles.length, 0);
    const messages = buildEditionDigest(edition.name, data.date, newSections);

    console.log(`\n=== ${edition.name} (${newArticleCount} new, ${messages.length} message(s)) ===`);
    for (const message of messages) console.log(message + "\n---");

    if (args.send) {
      for (const message of messages) {
        await sendTelegramMessage(CHAT_ID, message);
        await new Promise((r) => setTimeout(r, 1200)); // stay well under Telegram rate limits
      }
      for (const section of newSections) {
        markSent(state, edition.slug, section.articles.map((a) => a.url));
      }
    }
    totalNew += newArticleCount;
  }

  if (args.send) saveState(state);

  console.log(`\n${args.send ? "Sent" : "[dry-run] Would send"} ${totalNew} new articles across ${editions.length} edition(s).`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
