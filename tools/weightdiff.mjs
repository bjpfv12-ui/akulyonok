import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 900, height: 500 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(800);

// Рисуем один и тот же текст на разных весах в canvas и сравниваем пиксели
const res = await p.evaluate(async () => {
  await document.fonts.load("700 40px Comfortaa");
  await document.fonts.load("500 40px Comfortaa");
  await document.fonts.load("400 40px Nunito");
  await document.fonts.load("600 40px Nunito");
  await document.fonts.load("700 40px Nunito");

  const draw = (family, weight) => {
    const c = document.createElement("canvas");
    c.width = 420; c.height = 80;
    const g = c.getContext("2d");
    g.fillStyle = "#000";
    g.font = `${weight} 48px "${family}"`;
    g.textBaseline = "top";
    g.fillText("Акулёнок", 4, 4);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let ink = 0, sum = 0;
    for (let i = 3; i < d.length; i += 4) { if (d[i] > 10) { ink++; sum += d[i]; } }
    return { ink, avg: Math.round(sum / Math.max(ink, 1)) };
  };

  const out = {};
  for (const f of ["Comfortaa", "Nunito"]) {
    out[f] = {};
    for (const w of [400, 500, 600, 700, 800]) out[f][w] = draw(f, w);
  }
  return out;
});

for (const [fam, weights] of Object.entries(res)) {
  console.log(fam + ":");
  const inks = Object.entries(weights).map(([w, v]) => `${w}=${v.ink}px`);
  console.log("  ink coverage: " + inks.join("  "));
  const uniq = new Set(Object.values(weights).map((v) => v.ink));
  console.log("  различных вариантов начертания: " + uniq.size + (uniq.size === 1 ? "  <-- ВСЕ ВЕСА ОДИНАКОВЫ" : ""));
}
await browser.close();
