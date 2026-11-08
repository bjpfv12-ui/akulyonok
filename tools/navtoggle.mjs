import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);

const r = await p.evaluate(() => {
  const nt = document.querySelector(".nav-toggle");
  const cs = getComputedStyle(nt);
  const bodyCs = getComputedStyle(document.body);
  const sr = document.querySelector(".sr-only");
  const srCs = getComputedStyle(sr);

  // точки в конце коротких строк
  const trailing = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.nodeValue.trim();
    const el = n.parentElement;
    if (!t || t.length > 60) continue;
    if (!/^(p|span|a|button|h1|h2|h3|li|dt|dd|label|strong)$/i.test(el.tagName)) continue;
    if (el.closest("p,span,a,button,h1,h2,h3,li,dt,dd,label") !== el) continue;
    if (/[.!?]$/.test(t) && !/^https?:/.test(t)) trailing.push(el.tagName + "." + el.className + " :: " + t);
  }
  return {
    navToggle: { fs: cs.fontSize, fw: cs.fontWeight, ff: cs.fontFamily, color: cs.color },
    body: { fs: bodyCs.fontSize, fw: bodyCs.fontWeight },
    srOnly: { fs: srCs.fontSize, fw: srCs.fontWeight },
    trailingPeriods: trailing
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
