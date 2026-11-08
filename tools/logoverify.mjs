import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
const loaded = [];
page.on("requestfailed", (r) => failed.push(r.url() + " :: " + (r.failure()?.errorText || "")));
page.on("response", (r) => {
  const u = r.url();
  if (/\.(png|webp|jpg|woff2)$/i.test(u)) loaded.push(r.status() + " " + u.split("/").pop());
});

await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const boxes = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  const imgs = [...document.images].map((i) => ({
    src: i.currentSrc.split("/").pop(),
    natural: i.naturalWidth + "x" + i.naturalHeight,
    rendered: Math.round(i.getBoundingClientRect().width) + "x" + Math.round(i.getBoundingClientRect().height),
    alt: i.getAttribute("alt"),
    complete: i.complete && i.naturalWidth > 0
  }));
  return {
    hero: pick(".hero-visual .mascot"),
    header: pick(".brand-mark"),
    footer: pick(".footer-logo"),
    imgs
  };
});

console.log(JSON.stringify(boxes, null, 2));
console.log("asset responses:", loaded);
console.log("failed requests:", failed.length ? failed : "none");

// футер ленивый: прокручиваем и ждём загрузки
await page.locator(".site-footer").scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);
const footerImg = await page.evaluate(() => {
  const i = document.querySelector(".footer-logo img");
  return { src: i.currentSrc.split("/").pop(), complete: i.complete && i.naturalWidth > 0, natural: i.naturalWidth + "x" + i.naturalHeight };
});
console.log("footer logo after scroll:", JSON.stringify(footerImg));

await page.locator(".hero-visual").screenshot({ path: "shots/logo-hero.png" });
await page.locator(".footer-brand").screenshot({ path: "shots/logo-footer.png" });
await browser.close();
