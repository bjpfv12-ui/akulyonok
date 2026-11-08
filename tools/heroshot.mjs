import { chromium } from "playwright";

const targets = [
  { label: "local-320", url: "http://127.0.0.1:8765/index.html", width: 320, height: 780 },
  { label: "local-390", url: "http://127.0.0.1:8765/index.html", width: 390, height: 844 },
  { label: "live-390", url: "https://qbzjid15zf9rt.space.mcode.io/", width: 390, height: 844 },
  { label: "live-320", url: "https://qbzjid15zf9rt.space.mcode.io/", width: 320, height: 780 }
];

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.width, height: t.height }, deviceScaleFactor: 2 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(t.url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `shots/${t.label}.png`, clip: { x: 0, y: 0, width: t.width, height: Math.min(t.height, 800) } });
  const info = await page.evaluate(() => {
    const cta = document.querySelector(".hero-actions .btn");
    const b = cta.getBoundingClientRect();
    const stack = document.elementsFromPoint(b.left + b.width / 2, b.top + b.height / 2).map((e) => e.tagName + "." + (typeof e.className === "string" ? e.className : ""));
    const mascot = document.querySelector(".mascot");
    const mb = mascot.getBoundingClientRect();
    return {
      cta: { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right) },
      mascot: { t: Math.round(mb.top), b: Math.round(mb.bottom), l: Math.round(mb.left), r: Math.round(mb.right) },
      stackAtCta: stack,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      heroH: Math.round(document.querySelector(".hero").getBoundingClientRect().height)
    };
  });
  console.log(t.label, JSON.stringify(info), "errs:", errs.length ? errs : "none");
  await page.close();
}
await browser.close();
