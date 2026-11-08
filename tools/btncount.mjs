import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);

const r = await p.evaluate(() => {
  const solid = [...document.querySelectorAll(".btn-primary")].map((b) => {
    const r = b.getBoundingClientRect();
    return { text: b.textContent.trim(), y: Math.round(r.top), bg: getComputedStyle(b).backgroundColor, h: Math.round(r.height) };
  });
  const hero = document.querySelector(".hero").getBoundingClientRect();
  const inner = document.querySelector(".hero-inner").getBoundingClientRect();
  const copy = document.querySelector(".hero-copy").getBoundingClientRect();
  const vis = document.querySelector(".hero-visual").getBoundingClientRect();
  return {
    solidButtons: solid,
    solidCount: solid.length,
    hero: { top: Math.round(hero.top), bottom: Math.round(hero.bottom), h: Math.round(hero.height) },
    innerTop: Math.round(inner.top),
    copyTop: Math.round(copy.top),
    visualTop: Math.round(vis.top),
    gapAboveCopy: Math.round(copy.top - inner.top),
    firstViewportFill: Math.round(hero.bottom),
    viewportH: window.innerHeight
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
