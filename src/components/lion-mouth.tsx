// The lion, mouth moving.
//
// Twelve frames of the brand animation - the lion from closed mouth to
// full roar, head lifting with it - cut from the 2.5-second MOV the
// mark was delivered as, laid in one vertical sprite (public/lion-
// mouth.webp), and picked by how loud the coach is right now. Frame 0
// is closed and at rest; frame 11 is the roar. The player hands in a
// level between 0 and 1 from the audio's own amplitude, and this shows
// the frame that matches: the mouth opens on the loud syllables and
// closes in the gaps, which is what lip-sync is at the distance a
// phone is held. No morphing, no phonemes - scrubbing the artist's own
// frames, which is why it looks like the lion and not a puppet of it.
//
// Regenerate the sprite with the notes in scripts/build-lion-mouth.md.

export const MOUTH_FRAMES = 12;
/** The sprite's frame size - 400 × 283, the mark's own proportion. */
export const MOUTH_ASPECT = "400 / 283";

/** The frame for a level: a gentle curve so quiet speech still moves
 *  the mouth, and the roar is kept for the loud moments. */
export function mouthFrame(level: number): number {
  const v = Math.max(0, Math.min(1, level));
  return Math.round(Math.pow(v, 0.8) * (MOUTH_FRAMES - 1));
}

export function LionMouth({
  level,
  className = "",
  style,
}: {
  /** 0 closed .. 1 roar. */
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
