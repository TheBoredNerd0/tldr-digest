// Network-facing helpers, with fetch stubbed: nothing here touches the internet.
const test = require("node:test");
const assert = require("node:assert/strict");
const { fetchOgImage, attachImages } = require("../scrape");
const { sendTelegramMessage, loadBotToken } = require("../send");

function stubFetch(handler) {
  const real = global.fetch;
  const calls = [];
  global.fetch = async (url, opts) => {
    calls.push({ url, opts });
    return handler(url, opts);
  };
  return { calls, restore: () => (global.fetch = real) };
}

const html = (body) => ({ ok: true, status: 200, text: async () => body });

test("fetchOgImage prefers og:image, falls back to twitter:image, and never throws", async () => {
  const s = stubFetch((url) => {
    if (url.endsWith("/og")) return html('<meta property="og:image" content="https://i.x/og.png"><meta name="twitter:image" content="https://i.x/tw.png">');
    if (url.endsWith("/tw")) return html('<meta name="twitter:image" content="https://i.x/tw.png">');
    if (url.endsWith("/none")) return html("<p>no image</p>");
    if (url.endsWith("/403")) return { ok: false, status: 403, text: async () => "" };
    throw new Error("network down");
  });
  try {
    assert.equal(await fetchOgImage("https://a.x/og"), "https://i.x/og.png");
    assert.equal(await fetchOgImage("https://a.x/tw"), "https://i.x/tw.png");
    assert.equal(await fetchOgImage("https://a.x/none"), null);
    assert.equal(await fetchOgImage("https://a.x/403"), null);
    assert.equal(await fetchOgImage("https://a.x/boom"), null);
  } finally {
    s.restore();
  }
});

test("attachImages only fetches for articles that don't already have an image", async () => {
  const s = stubFetch(() => html('<meta property="og:image" content="https://i.x/new.png">'));
  try {
    const editions = [{ name: "E", sections: [{ title: "S", articles: [
      { url: "https://a.x/1", image: "https://i.x/kept.png" },
      { url: "https://a.x/2", image: null },
    ] }] }];
    await attachImages(editions);
    assert.deepEqual(editions[0].sections[0].articles.map((a) => a.image), ["https://i.x/kept.png", "https://i.x/new.png"]);
    assert.deepEqual(s.calls.map((c) => c.url), ["https://a.x/2"]);
  } finally {
    s.restore();
  }
});

test("loadBotToken reads TELEGRAM_BOT_TOKEN and trims stray whitespace", () => {
  const prev = process.env.TELEGRAM_BOT_TOKEN;
  process.env.TELEGRAM_BOT_TOKEN = "  123:abc\n";
  try {
    assert.equal(loadBotToken(), "123:abc");
  } finally {
    if (prev === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = prev;
  }
});

test("sendTelegramMessage posts MarkdownV2 to the chat and surfaces API errors", async () => {
  const prev = process.env.TELEGRAM_BOT_TOKEN;
  process.env.TELEGRAM_BOT_TOKEN = "123:abc";
  let reply = { ok: true, result: {} };
  const s = stubFetch(() => ({ json: async () => reply }));
  try {
    await sendTelegramMessage("42", "hi");
    const { url, opts } = s.calls[0];
    assert.equal(url, "https://api.telegram.org/bot123:abc/sendMessage");
    assert.deepEqual(JSON.parse(opts.body), { chat_id: "42", text: "hi", parse_mode: "MarkdownV2", disable_web_page_preview: true });
    reply = { ok: false, error_code: 401, description: "Unauthorized" };
    await assert.rejects(sendTelegramMessage("42", "hi"), /Telegram send failed: .*Unauthorized/);
  } finally {
    s.restore();
    if (prev === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = prev;
  }
});
