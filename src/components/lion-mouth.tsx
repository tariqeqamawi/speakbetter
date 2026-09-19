// The lion, mouth moving.
//
// Twenty-eight frames of the brand animation - ten cut from the
// 2.5-second MOV the mark was delivered as, with two motion-
// interpolated in-betweens after each - laid in one vertical sprite
// (public/lion-mouth.webp), and picked by how loud the coach is right
// now.
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

export const MOUTH_FRAMES = 28;
/** The widest frame talking reaches: real frame 7 (source 18). Frame 8
 *  read as too wide for speech - a shout rather than a word - and 9 is
 *  the roar itself. The small movements are where talking lives. */
export const MOUTH_TOP = 21;
/** The sprite's frame size - 440 × 343: the whole lion, mane to chin,
 *  and the mic, without the wave. */
export const MOUTH_ASPECT = "440 / 343";

/** The position in the sprite for a level, fractional. The sprite
 *  isn't linear: the first real frames are the draw-in, the face
 *  moving outward with the lips barely parting, and the mouth only
 *  visibly opens halfway along. So the level walks the first frames
 *  quickly (square root) and spends its range where the opening
 *  shows; the envelope that feeds it does the smoothing. */
export function mouthPosition(level: number, top: number = MOUTH_TOP): number {
  const v = Math.max(0, Math.min(1, level));
  // Under a small level the mouth is shut, not ajar - the first open
  // frame has to be earned by a sound.
  if (v < 0.07) return 0;
  return Math.min(top, Math.sqrt(v) * top);
}

/** The nearest whole frame, for anything that wants one. */
export function mouthFrame(level: number): number {
  return Math.round(mouthPosition(level));
}

function frameStyle(frame: number): React.CSSProperties {
  return {
    backgroundImage: "url(/lion-mouth.webp)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% auto",
    // A vertical sprite: percentage position k/(N-1) lands exactly
    // on frame k, whatever the rendered size.
    backgroundPosition: `0 ${(frame / (MOUTH_FRAMES - 1)) * 100}%`,
  };
}

/**
 * The lion at a mouth level. Drawn as the two frames either side of
 * the fractional position, the upper one faded in by the remainder -
 * so a position between frames is a blend of them, which is motion
 * blur when the mouth is moving and a plain frame when it isn't.
 */
export function LionMouth({
  level,
  className = "",
  style,
  roar = false,
}: {
  /** 0 closed .. 1 as open as talking gets. */
  level: number;
  className?: string;
  style?: React.CSSProperties;
  /** Let 1 reach the roar itself - the last frame - rather than
   *  stopping where talking stops. */
  roar?: boolean;
}) {
  const pos = mouthPosition(level, roar ? MOUTH_FRAMES - 1 : MOUTH_TOP);
  const lower = Math.floor(pos);
  const upper = Math.min(MOUTH_FRAMES - 1, lower + 1);
  const mix = pos - lower;
  return (
    <div
      role="img"
      aria-label="Speak Better coach"
      className={className}
      style={{ aspectRatio: MOUTH_ASPECT, position: "relative", ...style }}
    >
      <div className="absolute inset-0" style={frameStyle(lower)} />
      {mix > 0.01 && (
        <div className="absolute inset-0" style={{ ...frameStyle(upper), opacity: mix }} />
      )}
    </div>
  );
}
