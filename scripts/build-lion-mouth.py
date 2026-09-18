# Builds public/lion-mouth.webp from the brand MOV's frames. See
# build-lion-mouth.md for the frame choice; this is step 2 and 3 of it,
# plus the mouth edit: the mark is drawn with the lips slightly parted,
# so the resting frame has its wedge shrunk to look shut, and the edit
# tapers out over the next three frames so the opening is continuous.
#
#   ffmpeg -i SpeakBetter1.mov -pix_fmt rgba f%03d.png
#   python scripts/build-lion-mouth.py <dir with f011.png .. f020.png>
from PIL import Image
import numpy as np

X0, X1, Y0, Y1 = 1040, 1115, 430, 520  # the mouth zone, full-res source

def close_mouth(img, c):
    """Shrink the dark mouth wedge to (1-c) of its height by extending
    the chin up over it. The head's outline is untouched; only the gap
    between the lips gets thinner."""
    if c <= 0:
        return img
    a = np.array(img).astype(np.float32)
    out = a.copy()
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    dark = (al > 200) & (r + g + b < 360) & (r > g)
    darkish = (al > 0) & (r + g + b < 520) & (r > g)
    # per column: top and bottom of the wedge
    top, bot = {}, {}
    for x in range(X0, X1):
        ys = np.where(dark[Y0:Y1, x])[0]
        if len(ys) >= 3 and 435 <= Y0 + ys[0] <= 465:
            top[x], bot[x] = Y0 + ys[0], Y0 + ys[-1]
    xs = sorted(top)
    # the new lower edge, then smoothed across columns so it's a curve
    nb = {x: top[x] + (bot[x] - top[x] + 1) * (1 - c) for x in xs}
    sm = {}
    for x in xs:
        nbr = [nb[k] for k in range(x - 3, x + 4) if k in nb]
        sm[x] = sum(nbr) / len(nbr)
    for y in range(min(top.values()), max(bot.values()) + 1):
        row = np.where(dark[y, X0:X1])[0]
        if len(row) == 0:
            continue
        xl = X0 + row[0]
        # the chin's colour just left of the wedge on this row
        fx = xl - 3
        while fx > X0 - 20 and (al[y, fx] < 200 or darkish[y, fx]):
            fx -= 1
        fill = a[y, fx, :3]
        # from the wedge's left edge out to the silhouette
        for x in range(xl, X1):
            if al[y, x] <= 0:
                break
            if x not in sm or not darkish[y, x]:
                continue
            cov = min(1.0, max(0.0, y - sm[x] + 0.5))
            if cov <= 0:
                continue
            out[y, x, :3] = a[y, x, :3] * (1 - cov) + fill * cov
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


CROP = (598, 202, 1337, 778)          # common bounding box of frames 11-20
SIZE = (440, 343)
CLOSE = [0.6, 0.45, 0.3, 0.15, 0, 0, 0, 0, 0, 0]  # per sprite frame

if __name__ == "__main__":
    import os, sys
    d = sys.argv[1] if len(sys.argv) > 1 else "."
    out = sys.argv[2] if len(sys.argv) > 2 else "public/lion-mouth.webp"
    sprite = Image.new("RGBA", (SIZE[0], SIZE[1] * 10), (0, 0, 0, 0))
    for k, src in enumerate(range(11, 21)):
        im = Image.open(os.path.join(d, f"f{src:03d}.png")).convert("RGBA")
        im = close_mouth(im, CLOSE[k])
        sprite.paste(im.crop(CROP).resize(SIZE, Image.LANCZOS), (0, k * SIZE[1]))
    sprite.save(out, "WEBP", quality=92, method=6)
    print(out, os.path.getsize(out), "bytes")
