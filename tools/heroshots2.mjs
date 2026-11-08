import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const shots = [
  { name: "m-hero-320", width: 320, height: 760 },
  { name: "m-hero-390", width: 390, height: 800 },
  { name: "m-hero-768", width: 768, height: 700 },
  { name: "d-hero-1440", width: 1440, height: 720 }
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 2 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `shots/${s.name}.png` });
  console.log(s.name, "errors:", errs.length ? errs : "none");
  await page.close();
}
await browser.close();
