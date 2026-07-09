const fs = require("fs");
const path = require("path");

const STATE_PATH = path.join(__dirname, "state.json");

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { sent: {} }; // sent[slug] = array of article URLs already delivered
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Keep only the most recent N urls per edition so the file doesn't grow forever.
const MAX_PER_EDITION = 500;

function markSent(state, slug, urls) {
  const prev = state.sent[slug] || [];
  state.sent[slug] = [...prev, ...urls].slice(-MAX_PER_EDITION);
}

function alreadySent(state, slug, url) {
  return (state.sent[slug] || []).includes(url);
}

module.exports = { loadState, saveState, markSent, alreadySent };
