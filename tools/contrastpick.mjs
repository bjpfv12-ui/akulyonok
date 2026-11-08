// подбор тёмного оттенка для текста на фоне секции услуг #dfeaf6
const lum = (hex) => {
  const c = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const bgs = ['#dfeaf6', '#eaf2f9', '#f7fbfe', '#d9e9f8'];
const cands = ['#55708c', '#4d6884', '#48637f', '#45607c', '#3c5b7a', '#41607f', '#3f5c79'];

for (const c of cands) {
  const row = bgs.map((b) => `${b} ${ratio(c, b).toFixed(2)}`).join('  |  ');
  console.log(c, '->', row);
}
