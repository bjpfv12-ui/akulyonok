import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-in")));
await p.waitForTimeout(600);

const el = await p.$("#services");
if (el) { await el.screenshot({ path: "shots/aud-services.png" }); console.log("services ok"); }

const r = await p.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll("*")) {
    const s = getComputedStyle(e).fontSize;
    if (["12.5px", "13.3333px", "13.5px", "14.5px"].includes(s)) {
      out.push(`${e.tagName}.${e.className} -> ${s} "${(e.textContent || "").trim().slice(0, 30)}"`);
    }
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));

// структура .plans: сколько pack в каждой plan
const struct = await p.evaluate(() =>
  [...document.querySelectorAll(".plan")].map((pl) => ({
    title: pl.querySelector(".plan-title").textContent.trim(),
    packs: pl.querySelectorAll(".pack").length,
    height: Math.round(pl.getBoundingClientRect().height)
  }))
);
console.log("PLANS:", JSON.stringify(struct, null, 1));
await browser.close();
