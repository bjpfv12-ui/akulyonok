import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);

const r = await p.evaluate(() => {
  const sel = (e) => e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).join(".") : "");
  const byVal = {};
  const tiny = [];
  for (const e of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(e);
    for (const pr of ["marginTop", "marginBottom", "paddingTop", "paddingBottom", "gap", "rowGap"]) {
      const v = parseFloat(cs[pr]);
      if (v && Math.abs(v % 4) > 0.01) {
        const key = pr + "=" + cs[pr];
        byVal[key] = byVal[key] || new Set();
        byVal[key].add(sel(e));
      }
    }
    const fs = parseFloat(cs.fontSize);
    if ([12.5, 13.5, 14.5, 13.3333].includes(fs)) {
      tiny.push(`${sel(e)} fs=${cs.fontSize} "${(e.textContent || "").trim().slice(0, 22)}"`);
    }
  }
  const grouped = Object.fromEntries(Object.entries(byVal).map(([k, v]) => [k, [...v].slice(0, 8)]));

  const icons = {};
  for (const e of document.querySelectorAll("svg.icon")) {
    const cs = getComputedStyle(e);
    const par = e.closest("[class]");
    const key = par ? par.className : "?";
    icons[key] = icons[key] || new Set();
    icons[key].add(`${cs.width} / stroke ${cs.strokeWidth} / attr ${e.getAttribute("stroke-width")}`);
  }
  return { grouped, tiny, icons: Object.fromEntries(Object.entries(icons).map(([k, v]) => [k, [...v]])) };
});

console.log("=== OFF-GRID SPACING ===");
for (const [k, v] of Object.entries(r.grouped)) console.log(` ${k} -> ${v.join(" | ")}`);
console.log("\n=== FRACTIONAL FONT SIZES ===");
r.tiny.forEach((x) => console.log(" " + x));
console.log("\n=== ICON GROUPS ===");
for (const [k, v] of Object.entries(r.icons)) console.log(` ${k} -> ${v.join(" ; ")}`);
await browser.close();
