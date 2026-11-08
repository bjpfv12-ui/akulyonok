import { chromium } from "playwright";

const url = "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

const data = await page.evaluate(async () => {
  const out = { loaded: [], faces: [], widths: {}, axes: {} };

  // 1. какие @font-face реально загрузились
  for (const f of document.fonts) {
    out.loaded.push({ family: f.family, weight: f.weight, status: f.status, unicodeRange: f.unicodeRange });
  }

  // 2. измеряем ширину одного и того же текста на разных весах:
  //    если файл вариативный и веса работают -> ширины разные
  const probe = (family, weights) => {
    const c = document.createElement("canvas").getContext("2d");
    const res = {};
    for (const w of weights) {
      c.font = `${w} 40px "${family}"`;
      res[w] = Math.round(c.measureText("Акулёнок Центр").width * 100) / 100;
    }
    return res;
  };
  out.widths.Nunito = probe("Nunito", [400, 500, 600, 700, 800]);
  out.widths.Comfortaa = probe("Comfortaa", [400, 500, 600, 700]);
  out.widths.fallback = probe("NoSuchFontXYZ", [400, 700]);

  // 3. реально применённый шрифт у ключевых элементов
  const used = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { font: cs.fontFamily, weight: cs.fontWeight, size: cs.fontSize, ls: cs.letterSpacing, color: cs.color };
  };
  out.used = {
    h1: used(".hero-title"),
    h2: used(".section-title"),
    body: used("body"),
    btn: used(".btn-primary"),
    eyebrow: used(".eyebrow"),
    nav: used(".nav a"),
    featureTitle: used(".feature-title"),
    specValue: used(".spec-value"),
    price: used(".pack-price")
  };

  // 4. проверка наличия fvar через загрузку в canvas недоступна; смотрим CSS-веса
  const faces = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) {
        faces.push({
          family: r.style.fontFamily,
          weight: r.style.fontWeight,
          display: r.style.fontDisplay,
          src: (r.style.src || "").split("/").pop().replace(/['")]/g, "")
        });
      }
    }
  }
  out.faces = faces;
  return out;
});

console.log("=== ЗАГРУЖЕННЫЕ ШРИФТЫ (document.fonts) ===");
const byFamily = {};
for (const f of data.loaded) {
  byFamily[f.family] = byFamily[f.family] || { status: new Set(), weights: new Set() };
  byFamily[f.family].status.add(f.status);
  byFamily[f.family].weights.add(f.weight);
}
for (const [fam, v] of Object.entries(byFamily)) {
  console.log(` ${fam}: статусы=${[...v.status].join(",")} веса=${[...v.weights].sort().join(",")}`);
}

console.log("\n=== @font-face ДЕКЛАРАЦИИ ===");
const seen = new Set();
for (const f of data.faces) {
  const key = `${f.family}|${f.weight}`;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(` ${f.family} weight=${f.weight} display=${f.display} src=${f.src}`);
}

console.log("\n=== ШИРИНА ТЕКСТА ПО ВЕСАМ (проверка вариативности) ===");
console.log(" Nunito:   ", JSON.stringify(data.widths.Nunito));
console.log(" Comfortaa:", JSON.stringify(data.widths.Comfortaa));
console.log(" fallback: ", JSON.stringify(data.widths.fallback));

console.log("\n=== ПРИМЕНЁННЫЕ ШРИФТЫ ===");
for (const [k, v] of Object.entries(data.used)) {
  if (v) console.log(` ${k.padEnd(13)} ${v.font} | w=${v.weight} ${v.size} ls=${v.ls}`);
}
await browser.close();
