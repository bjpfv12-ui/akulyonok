import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8765/index.html";
const widths = [320, 360, 390, 414, 600, 768, 820, 960, 1024, 1280, 1440];

const browser = await chromium.launch();
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const d = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const R = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    };
    const cta = q(".hero-actions .btn");
    const cb = cta.getBoundingClientRect();
    const cx = cb.left + cb.width / 2;
    const cy = cb.top + cb.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    // проверяем 5 точек по кнопке
    const pts = [
      [cb.left + 4, cb.top + 4], [cb.right - 4, cb.top + 4],
      [cx, cy], [cb.left + 4, cb.bottom - 4], [cb.right - 4, cb.bottom - 4]
    ];
    const hits = pts.map(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el ? (el === cta || cta.contains(el) ? "cta" : el.tagName + "." + (typeof el.className === "string" ? el.className : "")) : "null";
    });
    const ob = (a, b) => {
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      return w > 0 && h > 0 ? +(w * h).toFixed(1) : 0;
    };
    const ctaR = R(cta), discR = R(q(".disc")), ringR = R(q(".ring-2")), masR = R(q(".mascot"));
    return {
      cta: ctaR, disc: discR, ring2: ringR, mascot: masR,
      hitCta: hits.every((h) => h === "cta"),
      hits,
      ovDisc: ob(discR, ctaR), ovRing: ob(ringR, ctaR), ovMascot: ob(masR, ctaR),
      gapMascotCta: masR && ctaR ? +(ctaR.t - masR.b).toFixed(1) : null,
      scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
      heroCols: getComputedStyle(q(".hero-inner")).gridTemplateColumns
    };
  });
  const ok = d.hitCta && d.ovDisc === 0 && d.ovRing === 0 && d.ovMascot === 0 && d.scrollW <= d.innerW;
  console.log(String(width).padStart(5), ok ? "OK " : "FAIL", "hitCta:", d.hitCta, "ovDisc:", d.ovDisc, "ovRing:", d.ovRing, "ovMascot:", d.ovMascot,
    "| cta", JSON.stringify(d.cta), "mascot", JSON.stringify(d.mascot), "gap", d.gapMascotCta,
    "| scrollW", d.scrollW, "/", d.innerW, "| cols", d.heroCols, d.hits.join(","));
  await page.close();
}
await browser.close();
