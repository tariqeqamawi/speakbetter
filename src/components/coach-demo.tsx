"use client";

import { useCallback, useState } from "react";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { TalkingLion } from "@/components/talking-lion";
import { CheckIcon, SpectrumIcon } from "@/components/icons";

// The coaching mechanic, played out on the landing page. A visitor
// otherwise can't see what they're buying until they've paid, onboarded
// and uploaded — so this runs a sample review end to end: the coach
// watches, the colours light up, the notes land, and the lion says it
// out loud.
//
// Clearly labelled as a sample. Nothing here is presented as real
// student data.

const SAMPLE_SPECTRUM: Record<CategoryId, number> = {
  storytelling: 78,
  figurative: 34,
  acting: 62,
  structure: 71,
  mindset: 83,
  "body-language": 29,
  advanced: 44,
};

const SAMPLE_NOTES: { category: CategoryId; note: string }[] = [
  {
    category: "body-language",
    note: "Your hands went quiet at the key moment — that's exactly when they should be painting the picture.",
  },
  {
    category: "figurative",
    note: "The middle third went flat. One vivid comparison would have lifted it.",
  },
  {
    category: "storytelling",
    note: "Strong instinct dropping straight into the scene. Keep doing that.",
  },
];

const SPOKEN =
  "Nice work — that passed. Two things for next time. Your hands went quiet at the key moment, and that is exactly when they should be painting the picture. And the middle third went flat: one vivid comparison would lift it. Strong instinct dropping straight into the scene, though. Keep doing that.";

type Stage = "idle" | "watching" | "scored";

export function CoachDemo() {
  const [stage, setStage] = useState<Stage>("idle");

  const run = useCallback(() => {
    setStage("watching");
    // long enough to read as real work, short enough not to bore
    window.setTimeout(() => setStage("scored"), 2200);
  }, []);

  const lit = categories.filter((c) => SAMPLE_SPECTRUM[c.id] >= 40).length;
  const scored = stage === "scored";

  return (
    <div className="grid w-full gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* the coach */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-5">
        <TalkingLion text={SPOKEN} />
        <p className="text-center text-xs text-ink-faint">
          Sample voice only — the coach&apos;s real voice is being cast.
        </p>
      </div>

      {/* the review */}
      <div className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-5">
        {stage === "idle" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
            <SpectrumIcon className="size-8 text-body-language" />
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-ink">See a review happen</h3>
              <p className="max-w-xs text-sm text-ink-muted">
                This is what lands after you record a challenge — a score, your
                colour spectrum, and what to fix next.
              </p>
            </div>
            <button
              type="button"
              onClick={run}
              className="min-h-11 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
            >
              Run a sample review
            </button>
          </div>
        )}

        {stage === "watching" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="spectrum-rule h-1 w-32 animate-pulse rounded-full" />
            <p className="text-sm text-ink-muted">
              Your coach is watching the performance…
            </p>
            <p className="text-xs text-ink-faint">
              Gestures, eye contact, pacing, story
            </p>
          </div>
        )}

        {scored && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mindset">
                <CheckIcon className="size-3.5" />
                Challenge complete
              </span>
              <span className="text-3xl font-bold tabular-nums text-ink">
                74
                <span className="text-base font-normal text-ink-faint">/100</span>
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[0.7rem] uppercase tracking-wider text-ink-faint">
                Your colour spectrum — {lit} of 7 lit up
              </span>
              {categories.map((cat, i) => {
                const value = SAMPLE_SPECTRUM[cat.id];
                const on = value >= 40;
                return (
                  <div key={cat.id} className="flex items-center gap-2.5">
                    <span
                      className={`w-28 shrink-0 truncate text-[0.7rem] sm:w-36 ${
                        on ? "text-ink" : "text-ink-faint"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-navy-700">
                      <span
                        className={`block h-full rounded-full ${cat.bgClass}`}
                        style={{
                          width: `${value}%`,
                          opacity: on ? 1 : 0.35,
                          transition: `width 800ms cubic-bezier(0.22,1,0.36,1) ${i * 90}ms`,
                        }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[0.7rem] uppercase tracking-wider text-ink-faint">
                Focus on next
              </span>
              {SAMPLE_NOTES.map((n, i) => (
                <span
                  key={n.category}
                  className="coach-note flex items-start gap-2 text-sm text-ink"
                  style={{ animationDelay: `${700 + i * 260}ms` }}
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      categoryById.get(n.category)?.bgClass ?? ""
                    }`}
                  />
                  {n.note}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStage("idle")}
              className="min-h-11 self-start rounded-lg border border-navy-600 px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Run it again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
