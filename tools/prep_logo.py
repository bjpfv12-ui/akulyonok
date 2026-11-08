"""Сборка ассетов логотипа «Акулёнок» из исходного файла assets/logo.jpg.

Собирает три прозрачных ассета из одного исходника:
  logo.png   — полный лок-ап (акула + надпись), используется в футере
  mascot.png — акула с волнами, используется в герое
  mark.png   — плотная вырезка акулы для шапки и favicon

Фон удаляется заливкой от краёв, поэтому белый живот акулы и блики на глазах
остаются белыми, а не становятся прозрачными. Для каждого ассета рядом
кладутся оптимизированные PNG и WebP с прозрачностью.
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "logo.jpg"
OUT = ROOT / "assets"


def near_white_mask(arr):
    """True там, где пиксель близок к чистому белому."""
    return (arr[:, :, 0] > 232) & (arr[:, :, 1] > 232) & (arr[:, :, 2] > 232)


def flood_from_border(mask):
    """Заливка по 4-связности от границ кадра."""
    h, w = mask.shape
    reached = np.zeros_like(mask)
    queue = deque()

    def push(y, x):
        i = y * w + x
        if mask[y, x] and not reached[y, x]:
            reached[y, x] = True
            queue.append(i)

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while queue:
        i = queue.popleft()
        y, x = divmod(i, w)
        if x > 0:
            push(y, x - 1)
        if x < w - 1:
            push(y, x + 1)
        if y > 0:
            push(y - 1, x)
        if y < h - 1:
            push(y + 1, x)

    return reached


def strip_background(img):
    """Возвращает RGBA-копию без внешнего белого фона."""
    img = img.convert("RGBA")
    arr = np.array(img)
    mask = near_white_mask(arr[:, :, :3])
    reached = flood_from_border(mask)

    # мягкая полоса в 2 пикселя вокруг вырезанного фона убирает белый кант от jpeg
    band = reached.copy()
    for _ in range(2):
        grown = band.copy()
        grown[1:, :] |= band[:-1, :]
        grown[:-1, :] |= band[1:, :]
        grown[:, 1:] |= band[:, :-1]
        grown[:, :-1] |= band[:, 1:]
        band = grown

    luma = arr[:, :, :3].mean(axis=2)
    alpha = np.full(luma.shape, 255, dtype=np.uint8)
    alpha[reached] = 0
    edge = band & ~reached & (luma > 210)
    alpha[edge] = np.clip((255 - luma[edge]) * 6, 0, 255).astype(np.uint8)

    arr[:, :, 3] = alpha
    return Image.fromarray(arr, "RGBA")


def save_assets(img, stem, target_width):
    """Сохраняет оптимизированный PNG и WebP с прозрачностью.

    Ширина ограничена целевым размером: ассет отдаётся примерно в два
    раза крупнее, чем он показывается на странице, но не более.
    """
    if img.width > target_width:
        height = round(img.height * target_width / img.width)
        img = img.resize((target_width, height), Image.LANCZOS)

    png = OUT / f"{stem}.png"
    webp = OUT / f"{stem}.webp"
    img.save(png, optimize=True, compress_level=9)
    img.save(webp, format="WEBP", quality=92, method=6)
    print(f"  {stem}: {img.size[0]}x{img.size[1]}  png {png.stat().st_size // 1024} KB, webp {webp.stat().st_size // 1024} KB")
    return png


def main():
    src = Image.open(SRC)
    print(f"source: {src.size[0]}x{src.size[1]}")
    clean = strip_background(src)

    save_assets(clean, "logo", 720)

    # акула с волнами: та же пропорция, что и у исходника
    w, h = clean.size
    box = (int(w * 0.245), int(h * 0.165), int(w * 0.79), int(h * 0.635))
    mascot = clean.crop(box)
    save_assets(mascot, "mascot", 880)

    # плотная вырезка акулы без волн, для шапки и favicon
    # доли от размера ассета: кадрировка не зависит от разрешения исходника
    mark = mascot.crop(
        (
            int(mascot.width * 0.105),
            int(mascot.height * 0.096),
            int(mascot.width * 0.979),
            int(mascot.height * 0.899),
        )
    )
    save_assets(mark, "mark", 144)

    print("dimensions:")
    for stem in ("logo", "mascot", "mark"):
        with Image.open(OUT / f"{stem}.png") as im:
            print(f"  {stem}.png {im.size}")


if __name__ == "__main__":
    main()
