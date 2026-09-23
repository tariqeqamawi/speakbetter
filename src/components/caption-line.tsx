"use client";

import { useEffect, useState } from "react";

// One line of captions, said the way Coach's reviews are said: the
// words light as they're spoken and the line is replaced by the next.
// Used in the portrait takeover, where the video is cropped to fill a
// tall screen and the player's own captions are cropped away with it.
//
// Vimeo's cuechange gives the line and when it starts, but no timing
// inside it. So the words are paced at a speaker's rate across the
// line's own length - honest enough for a caption that's already on
// screen with the voice, and it never runs ahead of the next cue,
// which resets it.

/** Words a second, at the pace these lessons are spoken. */
const PACE = 3.1;

export function CaptionLine({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  // Keyed by the line, so a new line starts from its first word
  // without an effect resetting state during render.
  const [run, setRun] = useState<{ text: string; lit: number }>({ text, lit: 1 });
  const lit = run.text === text ? run.lit : 1;

  useEffect(() => {
    const startedAt = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const gone = (now - startedAt) / 1000;
      setRun({ text, lit: Math.min(words.length, Math.floor(gone * PACE) + 1) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, words.length]);

  if (words.length === 0) return null;
  return (
    <p className={`flex flex-wrap justify-center gap-x-[0.28em] gap-y-1 text-center ${className}`}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`transition-colors duration-200 ${
            i < lit ? "text-ink" : "text-ink-faint/60"
          } ${i === lit - 1 ? "caption-live" : ""}`}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
