import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await page.locator("#contact").scrollIntoViewIfNeeded();
await page.locator('#signup button[type="submit"]').click();
await page.waitForTimeout(400);
await page.locator(".form-card").screenshot({ path: "shots/form-errors.png" });

await page.evaluate(() => window.scrollTo(0, 0));
await page.locator("#about").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
const current = await page.evaluate(() => {
  const el = document.querySelector('.nav a[aria-current="true"]');
  return el ? el.textContent : null;
});
console.log("активный пункт меню:", current);
await browser.close();
