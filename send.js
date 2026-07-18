const fs = require("fs");
const path = require("path");
const os = require("os");

function loadBotToken() {
  // Prefer an environment variable so the sender works anywhere — GitHub Actions,
  // a fresh cloud container, etc. — not only inside the one long-lived Claude Code
  // container that happens to have the Telegram plugin's .env on disk. That
  // file-only lookup was the whole reason the digest stopped sending once the
  // original container was reclaimed.
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN.trim();

  const envPath = path.join(os.homedir(), ".claude/channels/telegram/.env");
  let content;
  try {
    content = fs.readFileSync(envPath, "utf8");
  } catch (err) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set. Provide it via the TELEGRAM_BOT_TOKEN " +
        `environment variable, or create ${envPath} containing ` +
        `TELEGRAM_BOT_TOKEN=<token>. (underlying error: ${err.message})`
    );
  }
  const match = content.match(/^TELEGRAM_BOT_TOKEN=(.+)$/m);
  if (!match) throw new Error("TELEGRAM_BOT_TOKEN not found in " + envPath);
  return match[1].trim();
}

async function sendTelegramMessage(chatId, text) {
  const token = loadBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    }),
  });
  const body = await res.json();
  if (!body.ok) {
    throw new Error(`Telegram send failed: ${JSON.stringify(body)}`);
  }
  return body;
}

module.exports = { sendTelegramMessage, loadBotToken };
