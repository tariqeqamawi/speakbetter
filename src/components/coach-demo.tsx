"use client";

import { useCallback, useState } from "react";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { TalkingLion, type SpokenCue } from "@/components/talking-lion";
import {
  BrushIcon,
  CheckCircleIcon,
  CheckIcon,
  FilmIcon,
  FlatlineIcon,
  HandIcon,
  PlayIcon,
  SpectrumIcon,
} from "@/components/icons";

// The coaching mechanic, played out on the landing page. A visitor
// otherwise can't see what they're buying until they've paid, onboarded
// and uploaded - so this runs a sample review end to end: the coach
// watches, the colors light up, the notes land, and the lion says it
// out loud.
//
// Clearly labelled as a sample. Nothing here is presented as real
// student data.

// Agrees with what the coach says: the scene and the hands worked,
// the voice stayed at one volume, a first take with room to grow.
const SAMPLE_SPECTRUM: Record<CategoryId, number> = {
  storytelling: 72,
  figurative: 34,
  acting: 41,
  structure: 58,
  mindset: 66,
  "body-language": 63,
  advanced: 22,
};

// Each note names the real lesson behind it - the same tie between
// coaching and curriculum a student gets after buying (§08). Shown as
// text, not links: the lessons live past the paywall.
const SAMPLE_NOTES: { category: CategoryId; note: string; lesson: string }[] = [
  {
    category: "storytelling",
    note: "You dropped us straight into the kitchen, no build-up - the scene, not the story - and it's why we were with you from the first line.",
    lesson: "Life Scene NOT Life Story",
  },
  {
    category: "body-language",
    note: "When you described the bread your hands drew the loaf - the width, the weight - so the gesture was doing the describing with you.",
    lesson: "Hand Gestures: Express Visually What You Say Verbally",
  },
  {
    category: "acting",
    note: "The middle third stayed at one volume, and the hands went quiet right at the line that mattered. Drop to a whisper there and bring one hand back up to paint it.",
    lesson: "Play With Your Voice (Tone and Melody)",
  },
];

// What the coach is talking about, moment by moment. The times are
// word timestamps from the clip itself (faster-whisper), in the clip's
// own time (it arrives already at the coach's pace) so each symbol
// lands on the word being spoken: the student hears "hands" and sees a
// hand. The clip is the settled voice (Charon, British, the lion's
// direction) said through /api/speak; regenerate it there if the line
// changes, and re-time these.
const CUES: SpokenCue[] = [
  {
    at: 8.4,
    until: 10.8,
    word: "Into the scene",
    colorClass: "text-storytelling",
    Icon: FilmIcon,
  },
  {
    at: 17.9,
    until: 20.6,
    word: "Hands",
    colorClass: "text-body-language",
    Icon: HandIcon,
  },
  {
    at: 23.2,
    until: 25.5,
    word: "Nice shirt",
    colorClass: "text-mindset",
    Icon: CheckCircleIcon,
    summary: false, // proof the coach watched, not something to work on
  },
  {
    at: 27.0,
    until: 28.6,
    word: "One volume",
    colorClass: "text-acting",
    Icon: FlatlineIcon,
  },
  {
    at: 34.6,
    until: 36.4,
    word: "Paint it",
    colorClass: "text-figurative",
    Icon: BrushIcon,
  },
  {
    at: 42.8,
    until: 45.9,
    word: "Passed",
    colorClass: "text-mindset",
    Icon: CheckCircleIcon,
    summary: false, // a verdict, not something to work on
  },
];

const SPOKEN =
  "Well done for getting this recorded - a full ninety seconds, standing, to a lens. That's not nothing. Two things worked. You dropped us straight into the kitchen, no build-up: that's the life-scene lesson, the scene not the story, and it's why we were with you from the first line. And when you described the bread, your hands drew the loaf - the width of it, the weight - so the gesture was doing the describing with you. Nice shirt, by the way. The blue works on camera. For next time: the middle third stayed at one volume. Your hands went quiet there too, right at the line that mattered. Drop to almost a whisper on that line, and bring one hand back up to paint it, and the rest will sound louder for it. The brief asked for one story with a beginning and an end - you had both. And that means... congratulations. You've passed this challenge.";

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
    <div className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-navy-600 bg-navy-800 p-5 shadow-[0_0_80px_-40px_var(--color-advanced)] sm:p-8">
      {/* the coach, large - the feature of the page */}
      <div className="flex flex-col items-center gap-3">
        <TalkingLion
          text={SPOKEN}
          audioSrc="/coach/sample-review.mp3"
          cues={CUES}
          captions
          large
        />
        <p className="max-w-lg text-center text-xs text-ink-faint">
          A sample review, spoken aloud by the coach - the words as captions,
          each skill named as it comes up. This is the voice, the lion, and the
          kind of feedback every take gets.
        </p>
      </div>

      {/* the review, beneath */}
      <div className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900/50 p-5">
        {stage === "idle" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
            <SpectrumIcon className="size-8 text-body-language" />
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-ink">See a review happen</h3>
              <p className="max-w-xs text-sm text-ink-muted">
                This is what lands after you record a challenge - a score, your
                color spectrum, and what to fix next.
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
                64
                <span className="text-base font-normal text-ink-faint">/100</span>
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[0.7rem] uppercase tracking-wider text-ink-faint">
                Your color spectrum - {lit} of 7 lit up
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
                  <span className="flex flex-col gap-0.5">
                    {n.note}
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                      <PlayIcon className="size-3 shrink-0" />
                      Watch the lesson: {n.lesson}
                    </span>
                  </span>
                </span>
              ))}
              <span
                className="coach-note text-xs text-ink-faint"
                style={{ animationDelay: `${700 + SAMPLE_NOTES.length * 260 + 200}ms` }}
              >
                Every note links straight to the one- or two-minute lesson that
                teaches it - feedback is never a dead end.
              </span>
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
