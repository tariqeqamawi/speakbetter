# The lion mouth sprite

`public/lion-mouth.webp` is sixteen frames of the brand animation
(`SpeakBetter1.mov`, 2.5 s, 75 frames, 1920 × 1080, QuickTime Animation
with alpha), laid out vertically, 400 × 247 each: the lion from closed
mouth at rest to a moderately open one. The roar at the top of the clip
is left out on purpose - at the size a coach is shown, a roar on every
loud syllable read as shouting. The soundwave under the lion is cropped
out (crop box 114,0 → 876,470 in the source frame, with anything of the
wave reaching into it cleared).

The frames come from the *closing* half of the clip, which settles
cleanly to rest. Openness was measured per frame as the pixel difference
from the first frame inside the head region, and the sixteen chosen rise
monotonically: source frames 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55,
54, 53, 52, 50, 49 - the last a mouth open the way a word opens it,
with the head still.

To rebuild from a new MOV:

1. `ffmpeg -i SpeakBetter1.mov -pix_fmt rgba f%03d.png` - a full ffmpeg
   (the one Playwright ships can't read MOV; the winget `Gyan.FFmpeg`
   build can).
2. Crop every frame to the lion and mic, measure openness, pick sixteen
   monotonic frames from closed to as-open-as-talking-gets.
3. Resize to 400 × 247, stack vertically, save as WebP with alpha.

`src/components/lion-mouth.tsx` picks a frame from the audio level;
`talking-lion.tsx` and `coach-popin.tsx` feed it.
