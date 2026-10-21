// Re-renders the whole site from data/days/*.json: every day page plus the
// home/archive, search index, Saved/Search pages and RSS feed. Run after a
// template change in html.js so old days pick it up too.
//
//   node scripts/rebuild.js
const { listDays, renderDay, writeSiteFiles } = require("../site");

const days = listDays();
for (const day of days) renderDay(day);
const manifest = writeSiteFiles();
console.log(`rendered ${days.length} day page(s); archive lists ${manifest.length}`);
