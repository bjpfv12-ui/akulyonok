import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(900);

const geo = await p.evaluate(() => {
  const box = document.querySelector(".footer-logo");
  const img = document.querySelector(".footer-logo img");
  const b = box.getBoundingClientRect();
  const i = img.getBoundingClientRect();
  return {
    box: { w: Math.round(b.width), h: Math.round(b.height) },
    img: { w: Math.round(i.width), h: Math.round(i.height) },
    natural: { w: img.naturalWidth, h: img.naturalHeight }
  };
});
console.log("FOOTER LOGO BOX:", JSON.stringify(geo));
await browser.close();
