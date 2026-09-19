# The lion mouth sprite

`public/lion-mouth.webp` is twenty-eight frames of the brand animation
(`SpeakBetter1.mov`, 2.5 s, 75 frames, 1920 × 1080, QuickTime Animation
with alpha) - ten real frames and two synthesised in-betweens after
each - laid out vertically, 440 × 343 each.

The clip is a roar in three parts: the lion draws in (frames 1–16, the
face contracting, mouth shut), opens and lunges out (17–40), and settles
back (41–75). The talking frames are source frames 11 to 20, in order:
11 is the most contracted pose in the clip and is the resting frame; 12
to 20 are the jaw dropping and the face opening outward, stopping before
the lunge becomes a roar. Everything below the mane (the soundwave) is
cleared, and the crop is the common bounding box of those ten frames
(598,202 → 1335,776 in the full 1920 × 1080 frame, with 12 px of padding).

To rebuild from a new MOV:

1. `ffmpeg -i SpeakBetter1.mov -pix_fmt rgba f%03d.png` - a full ffmpeg
   (the one Playwright ships can't read MOV; the winget `Gyan.FFmpeg`
   build can).
2. Take the draw-in-to-opening run (frames 11–20 in this cut), clear
   the wave, crop to their common bounding box.
3. Interpolate to three frames per real one with ffmpeg's
   `minterpolate` (motion-compensated, so edges move rather than
   cross-fade), RGB and alpha separately, and recombine.
4. Resize to 440 × 343, stack vertically, save as WebP with alpha, and
   set MOUTH_FRAMES, MOUTH_TOP and MOUTH_ASPECT in lion-mouth.tsx to
   match.

Steps 2 to 4 are `build-lion-mouth.py` (Pillow + numpy + ffmpeg), which
also closes the mouth: the mark is drawn with the lips slightly parted, so
the resting frame has its dark wedge shrunk to 40% of its height by
extending the chin over it (the outline is untouched), and the edit
tapers out over the next three frames - 45%, 30%, 15% - so the opening
stays continuous.

`src/components/lion-mouth.tsx` picks a frame from the audio level;
`talking-lion.tsx` and `coach-popin.tsx` feed it.
