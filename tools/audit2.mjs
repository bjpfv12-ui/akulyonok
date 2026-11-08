import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "networkidle" });
const r = await page.evaluate(() => {
  const out = { arial: [], realTransitionAll: [], familyCounts: {} };
  document.querySelectorAll("*").forEach((el) => {
    const cs = getComputedStyle(el);
    const tag = el.tagName + (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : "");
    if (/Arial/i.test(cs.fontFamily)) out.arial.push(tag);
    if (cs.transitionProperty.includes("all") && parseFloat(cs.transitionDuration) > 0) out.realTransitionAll.push(tag);
    const f = cs.fontFamily.split(",")[0].replace(/"/g, "");
    out.familyCounts[f] = (out.familyCounts[f] || 0) + 1;
  });
  return out;
});
console.log("Arial elements:", r.arial.length ? r.arial.slice(0, 10) : "none");
console.log("real transition:all:", r.realTransitionAll.length ? r.realTransitionAll.slice(0, 10) : "none");
console.log("families:", r.familyCounts);
await browser.close();
