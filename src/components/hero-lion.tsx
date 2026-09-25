"use client";

import { useEffect, useState } from "react";
import { RoarMark } from "@/components/roar-mark";
import { LionMouth } from "@/components/lion-mouth";
import type { SpeakLevel } from "@/components/speak-line";

// The hero's lion: the roaring brand mark - until Coach is asked to say
// the headline, when the talking lion takes its place and its mouth moves
// with his words (the level comes from the "Listen to Coach" button,
// SpeakLine, on the "hero" channel). When he finishes, back to the mark.

export function HeroLion({ className = "" }: { className?: string }) {
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const { channel, level } = (e as CustomEvent<SpeakLevel>).detail;
      if (channel === "hero") setLevel(level);
    };
    window.addEventListener("speak-line-level", on);
    return () => window.removeEventListener("speak-line-level", on);
  }, []);
  const talking = level !== null;
  return (
    <div className="relative">
      <RoarMark className={`${className} transition-opacity duration-300 ${talking ? "opacity-0" : "opacity-100"}`} />
      {/* The same lion, the same size and place, talking. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-end justify-center transition-opacity duration-300 ${
          talking ? "opacity-100" : "opacity-0"
        }`}
      >
        {talking && <LionMouth level={level ?? 0} live className="h-full w-auto" />}
      </div>
    </div>
  );
}
