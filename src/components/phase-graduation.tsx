"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { storyPhases } from "@/data/challenges";
import { categories } from "@/data/categories";
import { useCurrentPhaseIndex } from "@/components/journey-map";
import { useStore } from "@/lib/store";
import { playCelebration, hapticCelebrate } from "@/lib/feedback-fx";

// Graduating from one STORY phase to the next deserves a moment, not a
// number ticking over: a takeover with the student's own face, neon
// confetti in the spectrum's colors, and the name of the level they've
// just earned. Shown once per graduation - a localStorage high-water
// mark remembers the last phase celebrated (sessionStorage in the demo,
// so every fresh demo session gets to see it once).

const SEEN_KEY = "speak-better-graduated-v1";

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  spin: number;
}

export function PhaseGraduation() {
  const { state, ready } = useStore();
  const currentIndex = useCurrentPhaseIndex();
  const inDemo = usePathname().startsWith("/demo");
  // The phase index just completed, or null while quiet.
  const [show, setShow] = useState<number | null>(null);
  // Confetti drawn fresh for each celebration - generated in the effect
  // that opens the overlay, so it only ever runs on the client and the
  // randomness can't disagree with hydration.
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!ready || currentIndex === 0) return;
    const storage = inDemo ? window.sessionStorage : window.localStorage;
    const seen = Number(storage.getItem(SEEN_KEY) ?? "0");
    if (currentIndex <= seen) return;
    const t = window.setTimeout(() => {
      setPieces(
        Array.from({ length: 70 }, () => ({
          left: Math.random() * 100,
          delay: Math.random() * 2.5,
          duration: 2.6 + Math.random() * 1.8,
          color: `var(--color-${categories[Math.floor(Math.random() * categories.length)].id})`,
          size: 6 + Math.random() * 7,
          spin: Math.random() < 0.5 ? -1 : 1,
        })),
      );
      setShow(currentIndex - 1);
      playCelebration();
      hapticCelebrate();
    }, 700);
    return () => clearTimeout(t);
  }, [ready, currentIndex, inDemo]);

  const dismiss = () => {
    const storage = inDemo ? window.sessionStorage : window.localStorage;
    storage.setItem(SEEN_KEY, String(currentIndex));
    setShow(null);
  };

  if (show === null) return null;
  const passedPhase = storyPhases[show];
  const nextPhase = storyPhases[Math.min(show + 1, storyPhases.length - 1)];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-navy-950/92 p-6 backdrop-blur-sm"
      role="dialog"
      aria-label="Level complete"
    >
      {/* Neon confetti, falling for as long as they want to bask */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece absolute top-0 rounded-[2px]"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.45,
              backgroundColor: p.color,
              boxShadow: `0 0 8px ${p.color}`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              animationDirection: p.spin === 1 ? "normal" : "reverse",
            }}
          />
        ))}
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-navy-500 bg-navy-900/95 p-8 text-center shadow-2xl shadow-navy-950">
        <span
          className={`relative block size-24 overflow-hidden rounded-full border-4 shadow-[0_0_36px_-6px_currentColor] ${passedPhase.textClass} ${passedPhase.borderClass}`}
        >
          {state.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.avatar} alt="" className="size-full object-cover" />
          ) : (
            <Image
              src="/logo-mark.png"
              alt=""
              fill
              sizes="96px"
              className="object-contain p-3"
            />
          )}
        </span>

        <div className="flex flex-col gap-1">
          <span
            className={`text-[0.7rem] font-bold uppercase tracking-[0.35em] ${passedPhase.textClass}`}
          >
            Level {show + 1} cleared
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            {passedPhase.name}: complete
          </h2>
          <p className="text-sm text-ink-muted">
            Every challenge in this phase, passed on camera. That was you.
          </p>
        </div>

        <div className="spectrum-rule h-1 w-32 rounded-full" />

        <p className="text-sm text-ink">
          Next:{" "}
          <b className={nextPhase.textClass}>
            Level {Math.min(show + 2, storyPhases.length)} - {nextPhase.name}
          </b>
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="mt-1 flex min-h-11 items-center rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
        >
          Keep going
        </button>
      </div>
    </div>
  );
}
