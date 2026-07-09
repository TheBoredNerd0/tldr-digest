const fs = require("fs");
const path = require("path");
const os = require("os");

function loadBotToken() {
  const envPath = path.join(os.homedir(), ".claude/channels/telegram/.env");
  const content = fs.readFileSync(envPath, "utf8");
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
