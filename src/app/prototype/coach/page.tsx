"use client";

import { useState } from "react";
import { TalkingLion } from "@/components/talking-lion";

// Prototype route — not part of the student experience. Exists so the
// talking-coach idea can be judged before any voice or vector work is
// commissioned.

const samples = [
  {
    label: "Beginner feedback",
    text: "Nice work — you finished that one. Two things for next time. Your hands went quiet right at the key moment, and that is exactly when they should be painting the picture. And try one pause before your best line. Watch the Hand Gestures lesson, then go again.",
  },
  {
    label: "Advanced feedback",
    text: "Strong open — you earned attention in the first ten seconds, and the promise paid off cleanly at the end. Five colors lit up. What is missing is figurative language: the middle third went flat and one vivid metaphor would have lifted it. Push for six next time.",
  },
  {
    label: "Celebration",
    text: "You are a practicing machine! That is five attempts at the same challenge. Most people never try twice. Go you — you are getting so much better.",
  },
];

export default function CoachPrototypePage() {
  const [text, setText] = useState(samples[0].text);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          Prototype — not in the student app
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">The talking coach</h1>
        <p className="text-ink-muted">
          The brand lion, split into head and hinged jaw. Because it&apos;s drawn
          in profile, jaw rotation alone reads as speech — no phoneme mouth
          shapes required. Pick a sample or write your own, then listen.
        </p>
      </header>

      <TalkingLion text={text} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {samples.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setText(s.text)}
              className={`flex min-h-11 items-center rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors ${
                text === s.text
                  ? "border-ink-faint bg-navy-700 text-ink"
                  : "border-navy-600 bg-navy-800 text-ink-muted hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-navy-600 bg-navy-800 p-4 text-sm text-ink outline-none focus:border-ink-faint"
          aria-label="Coach script"
        />
      </section>

      <section className="rounded-xl border border-navy-600 bg-navy-800 p-5 text-sm text-ink-muted">
        <h2 className="mb-2 font-semibold text-ink">What you&apos;re hearing</h2>
        <p className="mb-2">
          The voice is your browser&apos;s built-in speech synthesis, used only
          because it needs no account to try. It is not the intended voice — a
          real TTS voice would be chosen and kept consistent.
        </p>
        <p>
          Its audio also can&apos;t be measured, so here the jaw is driven by an
          envelope pumped on each word. With a real voice file the jaw is driven
          by actual amplitude, which tracks far more closely — that path is
          already built into the component.
        </p>
      </section>
    </div>
  );
}
