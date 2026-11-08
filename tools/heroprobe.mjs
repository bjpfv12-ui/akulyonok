import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const widths = [320, 360, 390, 414, 768];

const browser = await chromium.launch();
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const data = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    };
    const cta = q(".hero-actions .btn");
    const heroVisual = q(".hero-visual");
    const mascot = q(".mascot");
    const mascotImg = q(".mascot img");
    const disc = q(".disc");
    const ring2 = q(".ring-2");
    const copy = q(".hero-copy");
    const title = q(".hero-title");
    const hit = document.elementFromPoint(
      cta.getBoundingClientRect().left + cta.getBoundingClientRect().width / 2,
      cta.getBoundingClientRect().top + cta.getBoundingClientRect().height / 2
    );
    const overlapArea = (a, b) => {
      if (!a || !b) return 0;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return w > 0 && h > 0 ? +(w * h).toFixed(1) : 0;
    };
    return {
      cta: r(cta), copy: r(copy), title: r(title), heroVisual: r(heroVisual),
      mascot: r(mascot), mascotImg: r(mascotImg), disc: r(disc), ring2: r(ring2),
      hitTag: hit ? hit.tagName + "." + (hit.className || "") : null,
      overlapDiscCta: overlapArea(r(disc), r(cta)),
      overlapMascotCta: overlapArea(r(mascot), r(cta)),
      overlapDiscCopy: overlapArea(r(disc), r(copy)),
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth
    };
  });
  console.log("=== width", width, "===");
  console.log(JSON.stringify(data, null, 1));
  await page.close();
}
await browser.close();
