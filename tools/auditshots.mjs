import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
await page.evaluate(() => {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
});
await page.waitForTimeout(800);

// по секциям
const sections = await page.evaluate(() =>
  [...document.querySelectorAll("main section, header.site-header, footer.site-footer")].map((s, i) => ({
    i, cls: s.className, id: s.id, label: s.querySelector("h1,h2")?.textContent?.trim() || s.className
  }))
);
console.log(JSON.stringify(sections, null, 1));

const shots = [
  { name: "aud-hero", sel: ".hero" },
  { name: "aud-about", sel: "#about" },
  { name: "aud-plans", sel: "#plans" },
  { name: "aud-contact", sel: "#contact" },
  { name: "aud-footer", sel: "footer.site-footer" }
];
for (const s of shots) {
  const el = await page.$(s.sel);
  if (!el) { console.log(s.name, "NOT FOUND", s.sel); continue; }
  await el.screenshot({ path: `shots/${s.name}.png` });
  console.log(s.name, "ok");
}
await browser.close();
