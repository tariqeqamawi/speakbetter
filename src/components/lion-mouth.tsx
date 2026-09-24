"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

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

/** A vertical sprite: percentage position k/(N-1) lands exactly on
 *  frame k, whatever the rendered size. */
function framePosition(frame: number): string {
  return `0 ${(frame / (MOUTH_FRAMES - 1)) * 100}%`;
}

function frameStyle(frame: number, art: boolean): React.CSSProperties {
  return {
    backgroundImage: art ? "url(/lion-mouth.webp)" : undefined,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% auto",
    backgroundPosition: framePosition(frame),
  };
}

// The sprite is 540 KB - most of what the landing page used to fetch
// before a visitor had scrolled at all, for lions that are all a few
// screens down. A background image is fetched the moment its element
// exists, on screen or not, so inside this provider each lion waits
// until it is within a couple of screens of the viewport before it
// asks for its art. Opt-in rather than everywhere: in the app the lion
// is usually on screen from the first paint, and there the server's
// HTML should carry it rather than have it arrive after hydration.
const ArtWhenNear = createContext(false);

export function LionArtWhenNear({ children }: { children: React.ReactNode }) {
  return <ArtWhenNear.Provider value>{children}</ArtWhenNear.Provider>;
}

function useArt(ref: React.RefObject<HTMLDivElement | null>): boolean {
  const lazy = useContext(ArtWhenNear);
  const [near, setNear] = useState(!lazy);
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      // Far enough ahead that a steady scroll never catches it
      // unpainted.
      { rootMargin: "1500px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, ref]);
  return near;
}

/**
 * Move a mouth drawn by <LionMouth live> to a new level, straight on
 * its nodes; `lion` is the LionMouth's own element. For a caller that
 * animates the level every frame: through React state that is a render
 * of the caller per frame, forever.
 */
export function paintMouth(lion: Element, level: number, roar = false) {
  const [lowerEl, upperEl] = lion.children as HTMLCollectionOf<HTMLElement>;
  if (!lowerEl || !upperEl) return;
  const pos = mouthPosition(level, roar ? MOUTH_FRAMES - 1 : MOUTH_TOP);
  const lower = Math.floor(pos);
  const mix = pos - lower;
  lowerEl.style.backgroundPosition = framePosition(lower);
  upperEl.style.backgroundPosition = framePosition(Math.min(MOUTH_FRAMES - 1, lower + 1));
  upperEl.style.opacity = mix > 0.01 ? String(mix) : "0";
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
  live = false,
}: {
  /** 0 closed .. 1 as open as talking gets. */
  level: number;
  className?: string;
  style?: React.CSSProperties;
  /** Let 1 reach the roar itself - the last frame - rather than
   *  stopping where talking stops. */
  roar?: boolean;
  /** Keep the upper frame in the DOM even when it is fully faded, so
   *  paintMouth always has both layers to write to. */
  live?: boolean;
}) {
  const own = useRef<HTMLDivElement>(null);
  const art = useArt(own);
  const pos = mouthPosition(level, roar ? MOUTH_FRAMES - 1 : MOUTH_TOP);
  const lower = Math.floor(pos);
  const upper = Math.min(MOUTH_FRAMES - 1, lower + 1);
  const mix = pos - lower;
  return (
    <div
      ref={own}
      role="img"
      aria-label="Speak Better coach"
      className={className}
      style={{ aspectRatio: MOUTH_ASPECT, position: "relative", ...style }}
    >
      <div className="absolute inset-0" style={frameStyle(lower, art)} />
      {(live || mix > 0.01) && (
        <div className="absolute inset-0" style={{ ...frameStyle(upper, art), opacity: mix > 0.01 ? mix : 0 }} />
      )}
    </div>
  );
}
