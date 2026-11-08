import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const r = await page.evaluate(() => {
  const out = {};

  // 1. ВСЕ уникальные значения по категориям
  const vals = (fn) => [...new Set([...document.querySelectorAll("body *")]
    .map(fn).filter((v) => v && v !== "none" && v !== "normal" && v !== "auto" && v !== "0px"))].sort();

  out.shadows = vals((el) => getComputedStyle(el).boxShadow);
  out.textShadows = vals((el) => getComputedStyle(el).textShadow);
  out.gradients = vals((el) => getComputedStyle(el).backgroundImage).filter((v) => v.includes("gradient"));
  out.bgColors = vals((el) => getComputedStyle(el).backgroundColor);
  out.borderRadius = vals((el) => getComputedStyle(el).borderRadius);
  out.transitions = vals((el) => getComputedStyle(el).transition);
  out.animations = vals((el) => getComputedStyle(el).animationName);
  out.letterSpacing = vals((el) => getComputedStyle(el).letterSpacing);
  out.fontSizes = vals((el) => getComputedStyle(el).fontSize);
  out.fontWeights = vals((el) => getComputedStyle(el).fontWeight);
  out.families = vals((el) => getComputedStyle(el).fontFamily);

  // 2. иконки: размеры и наличие svg
  const icons = [...document.querySelectorAll("svg.icon, .icon")].map((el) => {
    const cs = getComputedStyle(el);
    return { w: cs.width, h: cs.height, tag: el.tagName, box: el.getAttribute("viewBox") };
  });
  out.iconSizes = [...new Set(icons.map((i) => `${i.w}x${i.h}`))];
  out.iconCount = icons.length;
  out.iconViewBoxes = [...new Set(icons.map((i) => i.box))];
  // inline svg без класса .icon
  out.svgTotal = document.querySelectorAll("svg").length;

  // 3. border-radius по элементам (вложенность)
  out.radiusBySel = {};
  for (const sel of [".btn", ".btn-primary", ".card", ".plan", ".form-card", ".contact-info", ".feature", ".spec-panel", ".map-frame", ".pack"]) {
    const el = document.querySelector(sel);
    if (el) {
      const cs = getComputedStyle(el);
      out.radiusBySel[sel] = { r: cs.borderRadius, pad: cs.padding };
    }
  }

  // 4. числа: формат и tabular
  out.tabularCount = [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.fontVariantNumeric.includes("tabular-nums");
  }).length;

  // 5. тексты с восклицательными знаками
  const ex = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.includes("!") && node.parentElement.closest("p,span,a,button,h1,h2,h3,li,dt,dd,label")) {
      ex.push(node.nodeValue.trim().slice(0, 80));
    }
  }
  out.exclamations = ex;

  // 6. отступы на 4px-сетке (проверка шагов)
  const off = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    for (const prop of ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "marginTop", "marginBottom", "gap", "rowGap"]) {
      const v = parseFloat(cs[prop]);
      if (v && Math.abs(v % 4) > 0.01) off.add(`${prop}=${cs[prop]}`);
    }
  }
  out.offGridSpacing = [...off].sort();

  // 7. transition: all
  out.transitionAll = [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).transitionProperty === "all").length;

  // 8. веса: сколько элементов с каждым весом в крупных заголовках
  const h = [...document.querySelectorAll("h1,h2,h3")].map((el) => ({ t: el.textContent.trim().slice(0, 30), w: getComputedStyle(el).fontWeight, s: getComputedStyle(el).fontSize }));
  out.headings = h;

  return out;
});

console.log(JSON.stringify(r, null, 1));
await browser.close();
