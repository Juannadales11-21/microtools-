const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function tools() {
  const dir = path.join(process.cwd(), "tools");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

test("tools load without console errors", async ({ page }) => {
  const slugs = tools();
  if (!slugs.length) test.skip(true);

  const server = spawn("npx", ["-y","http-server",".","-p","4173","-c-1"]);
  await new Promise(r => setTimeout(r, 1500));

  const errors = [];
  page.on("console", m => m.type()==="error" && errors.push(m.text()));
  page.on("pageerror", e => errors.push(String(e)));

  for (const s of slugs) {
    await page.goto(`http://127.0.0.1:4173/tools/${s}/`);
    await expect(page.locator("h1")).toHaveCount(1);
  }

  server.kill();
  if (errors.length) throw new Error(errors.join("\n"));
});
