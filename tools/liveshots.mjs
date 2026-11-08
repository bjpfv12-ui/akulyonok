import { chromium } from "playwright";

const url = "https://qbzjid15zf9rt.space.mcode.io/";
const shots = [
  { name: "live-m-hero-390", width: 390, height: 800 },
  { name: "live-m-hero-320", width: 320, height: 760 },
  { name: "live-d-hero-1440", width: 1440, height: 720 }
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 2 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `shots/${s.name}.png` });
  console.log(s.name, "status:", resp.status(), "errors:", errs.length ? errs : "none");
  await page.close();
}
await browser.close();
