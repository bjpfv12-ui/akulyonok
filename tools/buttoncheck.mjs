import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);

const buttons = await page.evaluate(() => {
  return [...document.querySelectorAll(".pack .btn")].map((b) => {
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    return {
      text: b.textContent.trim(),
      bg: cs.backgroundColor,
      color: cs.color,
      radius: cs.borderRadius,
      height: Math.round(r.height),
      width: Math.round(r.width),
      transition: cs.transitionProperty
    };
  });
});
console.log("кнопок в карточках:", buttons.length);
const unique = [...new Set(buttons.map((b) => `${b.bg} | ${b.color} | ${b.radius} | ${b.height}px | ${b.transition}`))];
console.log("уникальные стили:", unique);
console.log("тексты:", buttons.map((b) => b.text).join(", "));

// проверка hover
await page.locator(".pack .btn").first().hover();
await page.waitForTimeout(300);
console.log("hover bg:", await page.locator(".pack .btn").first().evaluate((el) => getComputedStyle(el).backgroundColor));
await page.mouse.up();

// карточки: одинаковая ли подсветка
const packs = await page.evaluate(() => [...document.querySelectorAll(".pack")].map((p) => {
  const cs = getComputedStyle(p);
  return { bg: cs.backgroundColor, border: cs.borderTopWidth + " " + cs.borderTopColor, shadow: cs.boxShadow === "none" ? "none" : "yes", h: Math.round(p.getBoundingClientRect().height) };
}));
console.log("карточки:", JSON.stringify(packs));

// мобильный: ширина и высота
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: "domcontentloaded" });
await mobile.waitForTimeout(900);
const m = await mobile.evaluate(() => {
  const b = document.querySelector(".pack .btn");
  const r = b.getBoundingClientRect();
  const col = document.querySelector(".pack").getBoundingClientRect();
  return { btnW: Math.round(r.width), btnH: Math.round(r.height), colW: Math.round(col.width), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
});
console.log("мобильный:", JSON.stringify(m));

await page.locator("#services").scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.locator("#services").screenshot({ path: "shots/services-buttons.png" });
await mobile.locator("#services").scrollIntoViewIfNeeded();
await mobile.waitForTimeout(600);
await mobile.locator("#services").screenshot({ path: "shots/services-mobile.png" });

console.log("ошибки:", errors.length ? errors : "нет");
await browser.close();
