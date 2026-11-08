import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
page.on("requestfailed", (r) => failed.push(r.url().slice(0, 90) + " :: " + (r.failure()?.errorText || "")));
page.on("response", (r) => { if (r.url().includes("yandex") && r.status() >= 400) failed.push(r.status() + " " + r.url().slice(0, 90)); });

await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await page.locator(".map-block").scrollIntoViewIfNeeded();
await page.waitForTimeout(6000);

const info = await page.evaluate(() => {
  const iframe = document.querySelector(".map-frame iframe");
  const box = iframe.getBoundingClientRect();
  return {
    src: iframe.getAttribute("src"),
    loading: iframe.getAttribute("loading"),
    title: iframe.getAttribute("title"),
    ariaLabel: iframe.getAttribute("aria-label"),
    width: Math.round(box.width),
    height: Math.round(box.height),
    frameRadius: getComputedStyle(iframe.parentElement).borderRadius,
    hasShadow: getComputedStyle(iframe.parentElement).boxShadow !== "none"
  };
});
console.log(JSON.stringify(info, null, 2));
console.log("frames:", page.frames().length);
for (const f of page.frames()) {
  if (f !== page.mainFrame()) {
    const t = await f.title().catch(() => "?");
    console.log("  subframe:", (f.url().slice(0, 80)), "| title:", t);
  }
}
await page.locator(".map-block").screenshot({ path: "shots/map.png" });
console.log("failed requests:", failed.length ? failed : "none");
await browser.close();
