# The lion mouth sprite

`public/lion-mouth.webp` is ten frames of the brand animation
(`SpeakBetter1.mov`, 2.5 s, 75 frames, 1920 × 1080, QuickTime Animation
with alpha), laid out vertically, 400 × 263 each.

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
3. Resize to 400 wide, stack vertically, save as WebP with alpha, and
   set MOUTH_FRAMES and MOUTH_ASPECT in lion-mouth.tsx to match.

`src/components/lion-mouth.tsx` picks a frame from the audio level;
`talking-lion.tsx` and `coach-popin.tsx` feed it.
