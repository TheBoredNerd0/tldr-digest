// Lightweight in-process daily scheduler — no system cron available in this container.
// Singapore has no DST, so "8am SGT" is always a fixed UTC offset (00:00 UTC).
const { execFile } = require("child_process");
const path = require("path");

const TARGET_UTC_HOUR = 0; // 08:00 Asia/Singapore == 00:00 UTC
const TARGET_UTC_MINUTE = 0;

function msUntilNextRun() {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      TARGET_UTC_HOUR,
      TARGET_UTC_MINUTE,
      0
    )
  );
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

function runDigest() {
  const ts = new Date().toISOString();
  console.log(`[${ts}] running daily digest send...`);
  execFile("node", ["publish.js"], { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) console.error(`[${ts}] digest run failed:`, err.message);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    scheduleNext();
  });
}

function scheduleNext() {
  const delay = msUntilNextRun();
  console.log(
    `[${new Date().toISOString()}] next run in ${(delay / 3600000).toFixed(2)}h (at 08:00 Asia/Singapore)`
  );
  setTimeout(runDigest, delay);
}

console.log(`[${new Date().toISOString()}] tldr-digest scheduler started, cwd=${__dirname}`);
scheduleNext();
