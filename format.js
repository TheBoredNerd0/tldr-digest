// Telegram MarkdownV2 requires escaping these literal characters when they're not
// acting as formatting syntax. Since headlines/blurbs are arbitrary scraped text,
// escape unconditionally rather than trying to detect intentional formatting.
const SPECIAL_CHARS = /[_*[\]()~`>#+\-=|{}.!\\]/g;

function escapeMarkdownV2(text) {
  return String(text).replace(SPECIAL_CHARS, (ch) => `\\${ch}`);
}

// Inside a MarkdownV2 link's (url) part, only `\` and `)` need escaping — escaping
// other characters would corrupt the URL itself.
function escapeUrl(url) {
  return String(url).replace(/[\\)]/g, (ch) => `\\${ch}`);
}

const TELEGRAM_MAX_LEN = 4096;
const SAFE_LEN = 3800; // leave headroom for the part-header added after chunking

function formatArticle(a) {
  const readTime = a.readTime ? ` \\(${escapeMarkdownV2(a.readTime)}\\)` : "";
  const lines = [`• *[${escapeMarkdownV2(a.headline)}](${escapeUrl(a.url)})*${readTime}`];
  if (a.blurb) lines.push(`  ${escapeMarkdownV2(truncate(a.blurb, 280))}`);
  return lines.join("\n");
}

function formatSectionBlock(section) {
  const lines = [`*${escapeMarkdownV2(section.title)}*`, ""];
  for (const a of section.articles) {
    lines.push(formatArticle(a));
    lines.push("");
  }
  return lines.join("\n").trim();
}

// Builds one "newsletter" style digest per edition instead of one message per section,
// packing section blocks greedily and only splitting into multiple parts if the whole
// edition doesn't fit in a single Telegram message.
function buildEditionDigest(editionName, date, sections) {
  const blocks = sections.map(formatSectionBlock);
  const chunks = [];
  let current = [];
  let currentLen = 0;

  for (const block of blocks) {
    const addedLen = block.length + 2;
    if (current.length > 0 && currentLen + addedLen > SAFE_LEN) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentLen = 0;
    }
    current.push(block);
    currentLen += addedLen;
  }
  if (current.length > 0) chunks.push(current.join("\n\n"));

  const total = chunks.length;
  return chunks.map((body, i) => {
    const partSuffix = total > 1 ? ` \\(${i + 1}/${total}\\)` : "";
    const header = [`📰 *${escapeMarkdownV2(editionName)} — TLDR Digest*${partSuffix}`];
    if (date) header.push(`_${escapeMarkdownV2(date)}_`);
    return [...header, "", body].join("\n");
  });
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + "…";
}

module.exports = { escapeMarkdownV2, buildEditionDigest, TELEGRAM_MAX_LEN };
