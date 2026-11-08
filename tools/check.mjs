import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);

// 1. выбор пакета переносится в форму
await page.locator('.pack:has-text("12 занятий") .btn').first().click();
await page.waitForTimeout(900);
console.log("пакет в форме:", await page.locator("#package").inputValue());

// 2. пустая отправка не проходит
const dialogs = [];
page.on("dialog", async (d) => { dialogs.push(d.message()); await d.accept(); });
await page.locator('#signup button[type="submit"]').click();
await page.waitForTimeout(400);
console.log("алерт при пустой форме:", dialogs.length ? dialogs[0] : "(нет, форма не отправлена)");
console.log("фокус на:", await page.evaluate(() => document.activeElement.id));

// 3. заполненная отправка показывает нужный алерт
await page.fill("#name", "Анна");
await page.fill("#phone", "+7 900 453-93-51");
await page.selectOption("#age", { index: 2 });
await page.locator('#signup button[type="submit"]').click();
await page.waitForTimeout(1400);
console.log("алерт при отправке:", dialogs[dialogs.length - 1] ?? "(нет)");
console.log("форма очищена:", (await page.locator("#name").inputValue()) === "" && (await page.locator("#package").inputValue()) === "");

// 4. телефон кликабелен
const tel = await page.locator(".contact-phone").getAttribute("href");
console.log("ссылка телефона:", tel);
console.log("телефон в футере:", await page.locator(".footer-phone").getAttribute("href"));

// 5. подсветка текущего дня
const today = await page.evaluate(() => {
  const row = document.querySelector(".hours-row.is-today");
  return row ? row.querySelector("dt").textContent : null;
});
console.log("подсвеченный день:", today);

// 6. мобильное меню
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: "domcontentloaded" });
await mobile.waitForTimeout(500);
await mobile.locator(".nav-toggle").click();
console.log("меню открыто:", await mobile.locator("#nav").evaluate((el) => el.classList.contains("is-open")));
await mobile.screenshot({ path: "shots/mobile-menu.png" });

console.log("ошибки:", errors.length ? errors : "нет");
await browser.close();
