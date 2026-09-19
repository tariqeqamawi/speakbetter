"""Builds public/lion-roar.webp: the brand roar as an animated WebP of
the lion and mic only (the wave beneath is cleared - the hero has its own
live wave), followed by a long hold on the resting frame so it plays
about every ten seconds. Also writes a per-frame report."""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[4] if len(sys.argv) > 4 else "roar"   # ffmpeg -i SpeakBetter1.mov -pix_fmt rgba roar/f%03d.png
OUT = "public/lion-roar.webp"
STILL = "public/lion-roar-still.png"
HOLD_MS = int(sys.argv[1]) if len(sys.argv) > 1 else 7500
WIDTH = int(sys.argv[2]) if len(sys.argv) > 2 else 520

def lion_only(im):
    """Keep the lion and the mic, drop the wave. The wave's crests sit
    right on the mane's tip in the loudest frames, so the cut is a line:
    nothing below y=757 left of the mic (the mane never reaches past it),
    then whatever's left that doesn't start high is wave too."""
    a = np.array(im)
    al = a[..., 3] > 0
    al[757:, :1150] = False
    lab, n = ndimage.label(al)
    keep = np.zeros_like(al)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl[0].start < 720:
            keep |= lab == i
    # and just above the line, the crests' thin tips: opened away
    opened = ndimage.binary_opening(al, structure=np.ones((7, 7)))
    band = np.zeros_like(al); band[738:, :1150] = True
    keep &= ~band | opened
    # and a crest's cyan peak riding on the mane's tip - no cyan in the mane
    cyan = (a[..., 1] > 150) & (a[..., 2] > 150) & (a[..., 0] < 130)
    keep &= ~(band & cyan)
    a = a.copy()
    a[~keep] = 0
    return a

frames = []
for n in range(1, 76):
    frames.append(lion_only(Image.open(os.path.join(SRC, f"f{n:03d}.png")).convert("RGBA")))

# common bounding box across the whole roar, padded
ys, xs = [], []
for a in frames:
    y, x = np.where(a[..., 3] > 0)
    ys += [y.min(), y.max()]; xs += [x.min(), x.max()]
pad = 14
crop = (max(0, min(xs) - pad), max(0, min(ys) - pad), max(xs) + pad, max(ys) + pad)
print("crop", crop, "aspect", (crop[2]-crop[0]) / (crop[3]-crop[1]))
w = WIDTH
h = round(w * (crop[3] - crop[1]) / (crop[2] - crop[0]))

ims = [Image.fromarray(a, "RGBA").crop(crop).resize((w, h), Image.LANCZOS) for a in frames]
ims[0].save(STILL, "PNG", optimize=True)
# The draw-in (1-16) and the settle (41-75) move slowly, so every other
# frame at half rate; the lunge (17-40) keeps all its frames at 30 fps.
pick = list(range(0, 16, 2)) + list(range(16, 40)) + list(range(40, 75, 2)) + [74]
durations = [66 if (i < 16 or i >= 40) else 33 for i in pick]
ims = [ims[i] for i in pick]
durations[-1] = HOLD_MS
ims[0].save(OUT, "WEBP", save_all=True, append_images=ims[1:], duration=durations, loop=0,
            quality=int(sys.argv[3]) if len(sys.argv) > 3 else 74, method=4, minimize_size=True, allow_mixed=True, alpha_quality=70)
print(OUT, len(ims), "frames", w, "x", h, os.path.getsize(OUT), "bytes; still", os.path.getsize(STILL))
