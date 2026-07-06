import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("C:/Users/User/AppData/Local/Temp/claude/d--web-patlu/1be343ca-5a5b-4181-a089-4fa097121749/scratchpad/x.mjs");
const puppeteer = require("puppeteer-core");

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error("Usage: node screenshot.mjs <url> [label]");
  process.exit(1);
}

const outDir = path.resolve("temporary screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const existing = fs.readdirSync(outDir).filter((f) => /^screenshot-\d+/.test(f));
const nextN = existing.reduce((max, f) => {
  const m = f.match(/^screenshot-(\d+)/);
  return m ? Math.max(max, parseInt(m[1], 10) + 1) : max;
}, 1);

const fileName = label ? `screenshot-${nextN}-${label}.png` : `screenshot-${nextN}.png`;
const outPath = path.join(outDir, fileName);

const browser = await puppeteer.launch({
  executablePath: "C:/Users/User/.cache/puppeteer/chrome/win64-148.0.7778.167/chrome-win64/chrome.exe",
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

// trigger lazy-loaded images by scrolling through the full page, then wait for them to decode
await page.evaluate(async () => {
  const distance = 500;
  const delay = 250;
  let total = 0;
  while (total < document.body.scrollHeight) {
    window.scrollBy(0, distance);
    total += distance;
    await new Promise((r) => setTimeout(r, delay));
  }
  window.scrollTo(0, 0);
});
await page.waitForFunction(
  () => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0),
  { timeout: 60000 }
).catch(() => {});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved ${outPath}`);
