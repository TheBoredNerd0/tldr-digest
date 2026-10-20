// Serves docs/ locally at http://localhost:8080/tldr-digest/ (the same path as
// GitHub Pages), so prev/next, search and saved work as they do live.
//
//   npm run preview            # or: node scripts/preview.js 3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "docs");
const PORT = Number(process.argv[2]) || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") {
      res.writeHead(302, { Location: "/tldr-digest/" });
      return res.end();
    }
    urlPath = urlPath.replace(/^\/tldr-digest/, "");
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const file = path.normalize(path.join(ROOT, urlPath));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403);
      return res.end("forbidden");
    }
    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404);
        return res.end("not found");
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(body);
    });
  })
  .listen(PORT, () => console.log(`Preview: http://localhost:${PORT}/tldr-digest/`));
