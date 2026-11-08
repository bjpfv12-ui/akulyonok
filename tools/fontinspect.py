import sys
from fontTools.ttLib import TTFont
import glob, os

files = sorted(glob.glob(r"C:\ak\akulyonok\assets\fonts\*.woff2"))
for f in files:
    try:
        font = TTFont(f)
        name = font["name"]
        def get(nid):
            r = name.getDebugName(nid)
            return r
        family = get(1)
        subfamily = get(2)
        full = get(4)
        ps = get(6)
        is_var = "fvar" in font
        axes = []
        if is_var:
            for a in font["fvar"].axes:
                axes.append(f"{a.axisTag}:{a.minValue}-{a.maxValue}")
        wght = None
        if "OS/2" in font:
            os2 = font["OS/2"]
            wght = f"usWeightClass={os2.usWeightClass}"
        print(f"{os.path.basename(f)}")
        print(f"   family={family!r} sub={subfamily!r} ps={ps!r}")
        print(f"   variable={is_var} axes={axes} {wght}")
        font.close()
    except Exception as e:
        print(os.path.basename(f), "ERR", e)
