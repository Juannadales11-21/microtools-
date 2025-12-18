const fs = require("fs");
const path = require("path");

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

function fail(msg) {
  console.error("QA FAIL:", msg);
  process.exit(1);
}

const toolsDir = path.join(process.cwd(), "tools");
if (!fs.existsSync(toolsDir)) process.exit(0);

const files = walk(toolsDir).filter(f => /\.(html|css|js|md)$/i.test(f));

for (const f of files) {
  const c = fs.readFileSync(f, "utf8");

  if (/<script[^>]+src=["']https?:\/\//i.test(c)) fail(`${f} usa CDN`);
  if (/<link[^>]+href=["']https?:\/\//i.test(c)) fail(`${f} usa CDN`);
  if (/fetch\s*\(\s*["']https?:\/\//i.test(c)) fail(`${f} usa fetch externo`);
}

const slugs = fs.readdirSync(toolsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
for (const slug of slugs) {
  const base = path.join(toolsDir, slug);
  ["index.html","styles.css","app.js","README.md"].forEach(f => {
    const p = path.join(base, f);
    if (!fs.existsSync(p)) fail(`tools/${slug} falta ${f}`);
    if (!fs.readFileSync(p, "utf8").trim()) fail(`tools/${slug}/${f} vacío`);
  });
}

console.log("Static QA OK");
