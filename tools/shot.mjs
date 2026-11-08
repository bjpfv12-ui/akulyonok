import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const shots = [
  { name: "desktop-hero", width: 1440, height: 900, full: false },
  { name: "desktop-full", width: 1440, height: 900, full: true },
  { name: "mobile-full", width: 390, height: 844, full: true }
];

const browser = await chromium.launch();
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  // trigger every reveal so the full-page shot is not half-faded
  await page.evaluate(() => {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/${shot.name}.png`, fullPage: shot.full });
  console.log(shot.name, "errors:", errors.length ? errors : "none");
  await page.close();
}
await browser.close();

