import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await page.locator(".map-block").scrollIntoViewIfNeeded();
await page.waitForTimeout(7000);
const info = await page.evaluate(() => {
  const iframe = document.querySelector(".map-frame iframe");
  const box = iframe.getBoundingClientRect();
  const parent = iframe.parentElement.getBoundingClientRect();
  return {
    iframeHeight: Math.round(box.height),
    frameWidth: Math.round(parent.width),
    viewport: window.innerWidth,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
});
console.log(JSON.stringify(info));
await page.locator(".map-block").screenshot({ path: "shots/mobile-map.png" });
await browser.close();
