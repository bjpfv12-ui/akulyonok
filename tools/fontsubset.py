import glob, os
from fontTools.ttLib import TTFont

def has(font, cps):
    cmap = font.getBestCmap()
    return all(ord(c) in cmap for c in cps)

probes = {
    "latin": "AZ az 09",
    "latin-ext": "ĀŽāžŐőŰű",
    "cyrillic": "АБЯабя",
    "cyrillic-ext": "ЀЁҐӀӿ",
    "vietnamese": "ĂăĐđŨũ",
}

for f in sorted(glob.glob(r"C:\ak\akulyonok\assets\fonts\*.woff2")):
    font = TTFont(f)
    name = font["name"].getDebugName(1)
    subsets = [k for k, cps in probes.items() if has(font, cps)]
    print(f"{os.path.basename(f)[:34]:36} {name:22} -> {', '.join(subsets)}")
    font.close()
