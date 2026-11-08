import { chromium } from "playwright";

const url = "https://qbzjid15zf9rt.space.mcode.io/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const failed = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("requestfailed", (r) => failed.push(r.url() + " :: " + (r.failure()?.errorText || "")));

const res = await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);

console.log("HTTP:", res.status());
console.log("title:", await page.title());
console.log("meta description:", await page.locator('meta[name="description"]').getAttribute("content"));

const imgs = await page.evaluate(() => [...document.images].map((i) => ({
  src: i.currentSrc.split("/").pop(),
  natural: i.naturalWidth + "x" + i.naturalHeight,
  ok: i.complete && i.naturalWidth > 0
})));
console.log("images:", JSON.stringify(imgs));

const font = await page.evaluate(() => getComputedStyle(document.querySelector("h1")).fontFamily);
console.log("headline font:", font);

const select = await page.evaluate(() => {
  const s = document.getElementById("package");
  return s ? { tag: s.tagName, options: s.options.length, value: s.value } : null;
});
console.log("package field:", JSON.stringify(select));

const map = await page.evaluate(() => {
  const f = document.querySelector(".map-frame iframe");
  return f ? { src: f.src.slice(0, 70), loading: f.getAttribute("loading") } : null;
});
console.log("map:", JSON.stringify(map));

await page.locator(".hero-visual").screenshot({ path: "shots/live-hero.png" });
await page.locator(".site-footer").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.locator(".footer-brand").screenshot({ path: "shots/live-footer.png" });

console.log("failed requests:", failed.length ? failed : "none");
console.log("console errors:", errors.length ? errors : "none");
await browser.close();
