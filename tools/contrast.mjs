import { chromium } from "playwright";

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/index.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(900);

const res = await p.evaluate(() => {
  const lum = (rgb) => {
    const c = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const parse = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  const ratio = (a, b) => {
    const l1 = lum(parse(a)), l2 = lum(parse(b));
    return +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))).toFixed(2);
  };
  // фон элемента: ищем первый непрозрачный предок
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      const m = cs.backgroundColor;
      if (m && !m.includes("rgba(0, 0, 0, 0)") && !m.includes("transparent")) return m;
      n = n.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };

  const out = [];
  const sels = [".pack-note", ".plan-note", ".pack-per", ".pack-name", ".included-title", ".feature-text",
    ".included-list li", ".section-title", ".lead", ".label", ".form-note", ".spec-label", ".contact-label",
    ".hours-row dt", ".hours-row dd", ".copyright", ".footer-address", ".socials", ".eyebrow", ".hero-sub"];
  for (const s of sels) {
    const el = document.querySelector(s);
    if (!el) continue;
    const cs = getComputedStyle(el);
    const bg = bgOf(el);
    const r = ratio(cs.color, bg);
    const fs = parseFloat(cs.fontSize);
    const fw = cs.fontWeight;
    const large = fs >= 24 || (fs >= 18.66 && +fw >= 700);
    const need = large ? 3 : 4.5;
    out.push({ sel: s, fs: cs.fontSize, fw: fw, color: cs.color, bg, ratio: r, need, pass: r >= need });
  }
  // фон секции услуг
  const sect = getComputedStyle(document.querySelector("#services")).backgroundColor;
  return { out, servicesBg: sect };
});

console.log("Фон секции услуг:", res.servicesBg, "\n");
for (const o of res.out) {
  console.log(`${o.pass ? "PASS" : "FAIL"}  ${o.sel.padEnd(20)} ${o.fs.padStart(7)} w${o.fw}  ${String(o.ratio).padStart(6)}:1  (нужно ${o.need})  ${o.color} на ${o.bg}`);
}
await browser.close();
