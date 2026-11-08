import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-in")));
await p.waitForTimeout(600);

// 1. заголовок секции под липкой шапкой при переходе по якорю
await p.click(".nav a[href='#services']");
await p.waitForTimeout(1200);
const anchor = await p.evaluate(() => {
  const h = document.querySelector("#services .section-title");
  const hdr = document.querySelector(".site-header");
  const r = h.getBoundingClientRect();
  const hr = hdr.getBoundingClientRect();
  return {
    titleTop: Math.round(r.top),
    headerBottom: Math.round(hr.bottom),
    hidden: r.top < hr.bottom,
    scrollPadding: getComputedStyle(document.documentElement).scrollPaddingTop
  };
});
console.log("ЯКОРЬ #services:", JSON.stringify(anchor));

// 2. тень кнопки и disc
const shadows = await p.evaluate(() => ({
  btn: getComputedStyle(document.querySelector(".btn-primary")).boxShadow,
  disc: getComputedStyle(document.querySelector(".disc")).boxShadow,
  card: getComputedStyle(document.querySelector(".form-card")).boxShadow,
  mascot: getComputedStyle(document.querySelector(".mascot")).filter
}));
console.log("ТЕНИ:", JSON.stringify(shadows, null, 1));

// 3. full-page снимок
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
await p.screenshot({ path: "shots/aud-full.png", fullPage: true });
console.log("full page ok");

// 4. контраст ink-500 на поверхностях
const colors = await p.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink900: cs.getPropertyValue("--ink-900").trim(),
    ink700: cs.getPropertyValue("--ink-700").trim(),
    ink500: cs.getPropertyValue("--ink-500").trim(),
    accentInk: cs.getPropertyValue("--accent-ink").trim(),
    surface: cs.getPropertyValue("--surface").trim(),
    surfaceSoft: cs.getPropertyValue("--surface-soft").trim(),
    surfaceTint: cs.getPropertyValue("--surface-tint").trim(),
    bg: cs.getPropertyValue("--bg").trim()
  };
});
console.log("ЦВЕТА:", JSON.stringify(colors, null, 1));
await browser.close();
