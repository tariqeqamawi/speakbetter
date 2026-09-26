# The origin story's "dream memory" look, laid over a real photograph:
#
#   python scripts/dream-film.py <in.png> <out.webp> [seed]
#
# The photo stays the photo - the composition, the people, the light -
# and the film goes on top: soft focus so faces dissolve, underdeveloped
# tones, neon halation blooming off every highlight, RGB fringing along
# every edge (strongest toward the frame's sides, as a cheap lens does),
# blotchy emulsion, a burnt light-leak edge, dust, scratches and grain.
# Deterministic per seed, so a re-run gives the same frame.
import sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 7
rng = np.random.default_rng(seed)

im = Image.open(src).convert("RGB")
im.thumbnail((1400, 1400))
W, H = im.size

# 1. Memory-soft: a gentle blur so the faces go, then a little detail back.
soft = im.filter(ImageFilter.GaussianBlur(W / 420))
a = np.asarray(soft).astype(np.float32) / 255

# 2. Underdeveloped: crushed shadows lifted to a muddy navy, highlights
#    kept, a cross-processed shift - teal in the shadows, magenta-gold up top.
lum = a.mean(axis=2, keepdims=True)
a = np.clip((a - 0.02) * 1.15 + 0.03, 0, 1) ** 1.0
shadow = np.array([0.03, 0.05, 0.11])
a = a * 0.92 + shadow * (1 - lum) * 0.55
tint = np.array([1.06, 0.93, 1.02])
a = np.clip(a * tint, 0, 1)

# 3. Halation: the brightest parts bloom outward in warm magenta-orange.
bright = np.clip((lum - 0.32) / 0.5, 0, 1)
glow_src = Image.fromarray((np.concatenate([bright, bright * 0.55, bright * 0.8], axis=2) * 255).astype(np.uint8))
glow = np.asarray(glow_src.filter(ImageFilter.GaussianBlur(W / 45))).astype(np.float32) / 255
glow2 = np.asarray(glow_src.filter(ImageFilter.GaussianBlur(W / 14))).astype(np.float32) / 255
a = 1 - (1 - a) * (1 - glow * 1.0) * (1 - glow2 * 0.7)

# 4. Chromatic aberration: red pushed out, blue pulled in, more toward the
#    edges of the frame - every contour fringed in neon.
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
cx, cy = W / 2, H / 2
r = np.sqrt(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2)
def shift(ch, k):
    s = 1 + k * (0.35 + r * 0.9)
    sx = np.clip(cx + (xx - cx) / s, 0, W - 1).astype(np.int32)
    sy = np.clip(cy + (yy - cy) / s, 0, H - 1).astype(np.int32)
    return ch[sy, sx]
off = W / 1400 * 0.014
a = np.stack([shift(a[..., 0], off), a[..., 1], shift(a[..., 2], -off)], axis=2)
# A neon fringe on edges: where brightness changes sharply, a magenta/cyan line.
edge_src = Image.fromarray((np.clip(lum[..., 0] * 1.6, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(2.2))
edge = np.asarray(edge_src).astype(np.float32)[..., None] / 255
fringe = np.concatenate([edge * 1.0, edge * 0.25, edge * 0.85], axis=2)
a = np.clip(a + fringe * 1.6, 0, 1)

# 5. Blotchy emulsion: low-frequency patches of darker, uneven development.
def noise(scale, octaves=3):
    out = np.zeros((H, W), np.float32)
    amp = 1.0
    for o in range(octaves):
        g = rng.random((max(2, H // (scale >> o)), max(2, W // (scale >> o)))).astype(np.float32)
        out += amp * np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
        amp *= 0.5
    return out / (2 - 2 ** (1 - octaves))
blot = noise(160)
a *= (0.84 + 0.28 * blot)[..., None]
stain = np.clip((noise(90) - 0.62) * 4, 0, 1)
a = a * (1 - stain[..., None] * 0.45) + np.array([0.35, 0.18, 0.05]) * stain[..., None] * 0.25

# 6. The burnt edge: a light leak in magenta-gold down one side, and a
#    ragged dark vignette.
leak_side = rng.integers(0, 2)
xn = xx / W if leak_side == 0 else 1 - xx / W
leak = np.clip(1 - xn / 0.22, 0, 1) ** 1.3 * (0.75 + 0.6 * noise(60))
leak_col = np.stack([np.ones_like(leak), 0.35 + 0.5 * yy / H, 0.55 + 0.2 * (1 - yy / H)], axis=2)
a = 1 - (1 - a) * (1 - np.clip(leak[..., None] * leak_col * 1.2, 0, 1))
vig = np.clip(1.25 - r * 0.45 - (noise(40) - 0.5) * 0.25, 0, 1)
a *= vig[..., None]

# 7. Dust, scratches and grain.
out = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
px = out.load()
for _ in range(int(W * H / 9000)):  # dust
    x, y = int(rng.random() * W), int(rng.random() * H)
    v = 255 if rng.random() < 0.6 else 0
    for dx in range(int(rng.integers(1, 3))):
        if x + dx < W:
            px[x + dx, y] = (v, v, v)
from PIL import ImageDraw
d = ImageDraw.Draw(out, "RGBA")
for _ in range(int(rng.integers(3, 7))):  # scratches
    x0, y0 = rng.random() * W, rng.random() * H
    ang = rng.normal(0.9, 0.35)
    ln = rng.random() * H * 0.9
    d.line([(x0, y0), (x0 + np.cos(ang) * ln * 0.35, y0 + np.sin(ang) * ln)], fill=(255, 255, 255, int(rng.integers(70, 150))), width=1)
g = np.asarray(out).astype(np.float32) / 255
g += rng.normal(0, 0.05, (H, W, 1)).astype(np.float32)
out = Image.fromarray((np.clip(g, 0, 1) * 255).astype(np.uint8))
out.save(dst, quality=86)
print("wrote", dst)
