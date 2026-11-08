import { chromium } from "playwright";

const url = process.argv[2] || "https://qbzjid15zf9rt.space.mcode.io/";
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const fontReqs = [];
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push(String(e)));
p.on("response", (r) => {
  const u = r.url();
  if (u.endsWith(".woff2")) fontReqs.push(u.split("/").pop());
});

const resp = await p.goto(url, { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")));
await p.waitForTimeout(400);

const info = await p.evaluate(() => {
  const cs = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { color: s.color, bg: s.backgroundColor, fs: s.fontSize, fw: s.fontWeight, ls: s.letterSpacing };
  };
  const icons = new Set();
  const strokes = new Set();
  for (const svg of document.querySelectorAll("svg.icon")) {
    const s = getComputedStyle(svg);
    icons.add(`${s.width}x${s.height}`);
    strokes.add(svg.getAttribute("stroke-width"));
  }
  const solid = [...document.querySelectorAll(".btn")].filter((b) => getComputedStyle(b).backgroundColor === "rgb(27, 79, 138)").length;
  const txt = document.body.innerText;
  return {
    planNote: cs(".plan-note"),
    packPer: cs(".pack-per"),
    includedTitle: cs(".included-title"),
    heroSub: document.querySelector(".hero-sub")?.textContent,
    icons: [...icons], strokes: [...strokes],
    solidButtons: solid,
    emDash: (txt.match(/[—–]/g) || []).length,
    exclamation: (txt.match(/!/g) || []).length,
    fontsLoaded: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`),
  };
});

console.log("HTTP", resp.status());
console.log("шрифты по сети:", fontReqs.join(", ") || "нет");
console.log(JSON.stringify(info, null, 1));
console.log("ошибки консоли:", errors.length ? errors : "нет");
await browser.close();
