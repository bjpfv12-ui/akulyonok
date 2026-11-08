import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);

const report = await page.evaluate(() => {
  const out = {};
  const text = document.body.innerText;

  out.emDash = (text.match(/—/g) || []).length;
  out.enDash = (text.match(/–/g) || []).length;
  out.emoji = (text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  out.uppercaseLabels = [...document.querySelectorAll("p,span,a,li")].filter((el) => {
    const t = (el.textContent || "").trim();
    return t.length > 2 && t.length < 40 && t === t.toUpperCase() && /[A-ZА-Я]/.test(t) && !el.querySelector("svg");
  }).length;

  out.fontsUsed = [...new Set([...document.querySelectorAll("h1,h2,h3,p,a,button,span")].map((el) => getComputedStyle(el).fontFamily))];
  out.heroTextElements = document.querySelectorAll(".hero-copy > *").length;
  out.eyebrows = document.querySelectorAll(".eyebrow").length;
  out.sections = document.querySelectorAll("main section").length;
  out.navHeight = document.querySelector(".site-header").getBoundingClientRect().height;
  out.deadLinks = [...document.querySelectorAll("a[href='#'], a[href='']")].length;
  out.imgNoAlt = [...document.querySelectorAll("img")].filter((i) => i.getAttribute("alt") === null).length;

  const iframe = document.querySelector(".map-frame iframe");
  out.map = iframe ? {
    loading: iframe.getAttribute("loading"),
    hasTitle: !!iframe.getAttribute("title"),
    hasAriaLabel: !!iframe.getAttribute("aria-label"),
    height: Math.round(iframe.getBoundingClientRect().height),
    radius: getComputedStyle(iframe.parentElement).borderRadius
  } : null;

  out.phoneLinks = [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute("href"));
  out.oldDemoData = /Самара|Волжская|9:00-20:00|Пн-Сб|\+7 \(999\)/.test(text);
  out.hoursRows = document.querySelectorAll(".hours-row").length;
  out.todayRow = (document.querySelector(".hours-row.is-today dt") || {}).textContent || null;

  let hoverOutside = 0;
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list, inHover) => {
      for (const rule of list) {
        if (rule.cssRules) {
          const isHover = inHover || (rule.conditionText || "").includes("hover: hover");
          walk(rule.cssRules, isHover);
        } else if (rule.selectorText && rule.selectorText.includes(":hover") && !inHover) {
          hoverOutside++;
        }
      }
    };
    walk(rules, false);
  }
  out.hoverOutsideMediaQuery = hoverOutside;

  out.scrollW = document.documentElement.scrollWidth;
  out.clientW = document.documentElement.clientWidth;
  return out;
});

console.log(JSON.stringify(report, null, 2));

for (const width of [1440, 1024, 768, 390, 320]) {
  const p = await browser.newPage({ viewport: { width, height: 800 } });
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(700);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`viewport ${width}px -> horizontal overflow: ${overflow}px`);
  await p.close();
}

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
