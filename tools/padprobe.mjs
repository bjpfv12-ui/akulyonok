import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);

const out = await p.evaluate(() => {
  const sel = (e) => e.tagName + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).join(".") : "");
  const res = [];
  for (const e of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(e);
    for (const pr of ["paddingLeft", "paddingRight"]) {
      const v = parseFloat(cs[pr]);
      if (v && Math.abs(v % 4) > 0.01) res.push(`${sel(e)} ${pr}=${cs[pr]}`);
    }
  }
  return res;
});
console.log(out.length ? out.join("\n") : "нет off-grid боковых padding");
await browser.close();
