// The lion, mouth moving.
//
// Ten frames of the brand animation, cut from the 2.5-second MOV the
// mark was delivered as, laid in one vertical sprite (public/lion-
// mouth.webp), and picked by how loud the coach is right now.
//
// The clip is a roar: the lion draws in - face contracted, mouth shut
// - then opens and lunges out, then settles. The talking frames are
// the draw-in and the start of the release: frame 0 is the most
// contracted pose in the clip (source frame 11), mouth shut and
// everything pulled inward, and the frames after it are the jaw
// dropping and the face opening outward, up to source frame 20 - open
// and alive, but before the lunge becomes a roar. So a syllable opens
// the mouth AND brings the face out, and the gap after draws it back
// in, which is the way the animator drew the lion coming alive. The
// soundwave under the lion is cropped out; it has its own, live, in
// talking-lion.tsx. The
// player hands in a level between 0 and 1 from the audio's own
// amplitude, and this shows the frame that matches: the mouth opens
// on the syllables and closes in the gaps, which is what lip-sync is
// at the distance a phone is held. No morphing, no phonemes -
// scrubbing the artist's own frames, which is why it looks like the
// lion and not a puppet of it.
//
// Regenerate the sprite with the notes in scripts/build-lion-mouth.md.

export const MOUTH_FRAMES = 10;
/** The sprite's frame size - 440 × 343: the whole lion, mane to chin,
 *  and the mic, without the wave. */
export const MOUTH_ASPECT = "440 / 343";

/** The frame for a level, straight: the sprite's own range is the
 *  restraint, and the envelope that feeds it does the smoothing. */
export function mouthFrame(level: number): number {
  const v = Math.max(0, Math.min(1, level));
  // Under a small level the mouth is shut, not ajar - the first open
  // frame has to be earned by a sound.
  if (v < 0.07) return 0;
  return Math.round(v * (MOUTH_FRAMES - 1));
}

export function LionMouth({
  level,
  className = "",
  style,
}: {
  /** 0 closed .. 1 as open as talking gets. */
  level: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const frame = mouthFrame(level);
  return (
    <div
      role="img"
      aria-label="Speak Better coach"
      className={className}
      style={{
        aspectRatio: MOUTH_ASPECT,
        backgroundImage: "url(/lion-mouth.webp)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% auto",
        // A vertical sprite: percentage position k/(N-1) lands exactly
        // on frame k, whatever the rendered size.
        backgroundPosition: `0 ${(frame / (MOUTH_FRAMES - 1)) * 100}%`,
        ...style,
      }}
    />
  );
}
