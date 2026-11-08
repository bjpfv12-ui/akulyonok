import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8766/index.html";
const browser = await chromium.launch();

async function shot(name, viewport, selector, opts = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")));
  await page.waitForTimeout(500);
  if (selector) {
    const el = await page.$(selector);
    if (!el) { console.log(name, "NOT FOUND", selector); await page.close(); return; }
    await el.screenshot({ path: `shots/${name}.png` });
  } else {
    await page.screenshot({ path: `shots/${name}.png`, fullPage: opts.fullPage === true });
  }
  console.log(name, "ok");
  await page.close();
}

await shot("fix-header", { width: 1440, height: 900 }, "header.site-header");
await shot("fix-hero", { width: 1440, height: 900 }, ".hero");
await shot("fix-plans", { width: 1440, height: 900 }, "#services");
await shot("fix-included", { width: 1440, height: 900 }, ".included");
await shot("fix-footer", { width: 1440, height: 900 }, "footer.site-footer");
await shot("fix-mobile-hero", { width: 390, height: 844 }, ".hero");
await shot("fix-mobile-services", { width: 390, height: 844 }, "#services");

await browser.close();
