import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const reqs = [];
p.on("response", (r) => {
  if (r.url().includes(".woff2")) reqs.push({ file: r.url().split("/").pop(), status: r.status() });
});
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(2500);
// прокрутка, чтобы подгрузить весь текст со страницы
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
});
await p.waitForTimeout(1500);

const all = [...new Set(reqs.map((r) => r.file))];
console.log("ЗАГРУЖЕНО БРАУЗЕРОМ (" + all.length + " файлов):");
all.forEach((f) => console.log("  " + f + "  " + reqs.find((r) => r.file === f).status));

const fs = await (await import("node:fs")).promises.readdir("C:/ak/akulyonok/assets/fonts");
const onDisk = fs.map((f) => f.replace(".woff2", ""));
const unused = onDisk.filter((f) => !all.includes(f + ".woff2"));
console.log("\nФАЙЛОВ НА ДИСКЕ: " + onDisk.length);
console.log("НЕ ЗАГРУЖАЮТСЯ (" + unused.length + "):");
let waste = 0;
for (const u of unused) {
  const st = await (await import("node:fs")).promises.stat("C:/ak/akulyonok/assets/fonts/" + u + ".woff2");
  waste += st.size;
  console.log("  " + u + ".woff2  " + Math.round(st.size / 1024) + " KB");
}
console.log("МЁРТВЫЙ ВЕС: " + Math.round(waste / 1024) + " KB");
await browser.close();
