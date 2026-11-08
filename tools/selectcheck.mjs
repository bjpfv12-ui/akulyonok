import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

// 1. клик по «Выбрать» в карточке услуги выбирает опцию и ведёт к форме
await page.locator('[data-pick="parent-trainer-8"]').click();
await page.waitForTimeout(1000);
console.log("значение select:", await page.locator("#package").inputValue());
console.log("текст опции:", await page.locator('#package option[value="parent-trainer-8"]').textContent());
console.log("подсветка применена:", await page.locator("#package").evaluate((el) => el.classList.contains("is-highlight")));
console.log("фокус на:", await page.evaluate(() => document.activeElement.id));
console.log("цвет текста:", await page.locator("#package").evaluate((el) => getComputedStyle(el).color));
await page.locator(".form-card").screenshot({ path: "shots/form-selected.png" });

// 2. выбор вручную меняет цвет с приглушённого на основной
await page.selectOption("#package", "trainer-baby-4");
await page.waitForTimeout(200);
console.log("цвет после ручного выбора:", await page.locator("#package").evaluate((el) => getComputedStyle(el).color));

// 3. отправка без выбора пакета
await page.locator("#package").evaluate((el) => { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); });
await page.fill("#name", "Анна");
await page.fill("#phone", "+7 900 453-93-51");
await page.selectOption("#age", { index: 2 });
console.log("цвет пустого поля:", await page.locator("#package").evaluate((el) => getComputedStyle(el).color));
const dialogs = [];
page.on("dialog", async (d) => { dialogs.push(d.message()); await d.accept(); });
await page.locator('#signup button[type="submit"]').click();
await page.waitForTimeout(400);
console.log("ошибка пакета:", await page.locator("#package-error").textContent());
console.log("ошибка видима:", await page.locator("#package-error").isVisible());
console.log("алерт (не должно быть):", dialogs.length ? dialogs[0] : "нет");
await page.locator(".form-card").screenshot({ path: "shots/form-package-error.png" });

// 4. отправка с выбранным пакетом
await page.selectOption("#package", "parent-baby-12");
await page.waitForTimeout(200);
console.log("ошибка пакета снята:", !(await page.locator("#package-error").isVisible()));
await page.locator('#signup button[type="submit"]').click();
await page.waitForTimeout(1400);
console.log("алерт:", dialogs[dialogs.length - 1] ?? "нет");
console.log("select сброшен:", await page.locator("#package").inputValue() === "");
console.log("форма очищена:", await page.locator("#name").inputValue() === "");

console.log("ошибки:", errors.length ? errors : "нет");
await browser.close();
