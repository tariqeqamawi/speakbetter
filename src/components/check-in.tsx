"use client";

import { useState } from "react";
import { useStore, type AppState } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { challengeProgress } from "@/lib/challenge-progress";
import { track } from "@/lib/insights";

// The student's own measure of the course, asked twice on Today.
//
// At the start: how confident do you feel speaking on camera, 1 to 10.
// At the end - every challenge passed, or five weeks in - the same
// question again, how likely they'd be to recommend Speak Better, and,
// if they want to, what changed for them (with permission to quote it,
// never with their name).
//
// Coach's scores say the speaking got better; this says the person
// feels it did. Side by side, they're the evidence the course works -
// for the student, and for anyone deciding whether to back it
// (/admin/data-room).

const FIVE_WEEKS = 35 * 86_400_000;

function startedAt(state: AppState): string | undefined {
  return state.checkIns?.startAt ?? state.consentAt ?? state.attempts[0]?.at;
}

function finished(state: AppState): boolean {
  if (challenges.every((c) => challengeProgress(c, state).passed)) return true;
  const start = startedAt(state);
  return Boolean(start && Date.now() - new Date(start).getTime() >= FIVE_WEEKS);
}

function Scale({
  from,
  to,
  value,
  onPick,
  low,
  high,
}: {
  from: number;
  to: number;
  value?: number;
  onPick: (n: number) => void;
  low: string;
  high: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            aria-pressed={value === n}
            className={`size-10 rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
              value === n
                ? "border-ink bg-ink text-navy-900"
                : "border-navy-600 bg-navy-900 text-ink-muted hover:border-ink-faint hover:text-ink"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[0.7rem] text-ink-faint">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function CheckIn() {
  const { state, ready, checkIn } = useStore();
  const [step, setStep] = useState<"confidence" | "recommend" | "story" | "thanks">("confidence");
  const [confidence, setConfidence] = useState<number>();
  const [story, setStory] = useState("");
  const [quoteOk, setQuoteOk] = useState(false);
  if (!ready || !state.unlocked || !state.consentAt) return null;
  const c = state.checkIns ?? {};

  // The start: once, before anything else is measured.
  if (c.startConfidence === undefined) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-body-language/40 bg-navy-800 p-5">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-body-language">Before you begin</span>
        <p className="text-lg font-semibold leading-snug text-ink">How confident do you feel speaking on camera right now?</p>
        <p className="text-sm text-ink-muted">Be honest - we&apos;ll ask again at the end, so you can see how far you&apos;ve come.</p>
        <Scale
          from={1}
          to={10}
          low="Not at all"
          high="Completely"
          onPick={(n) => {
            checkIn({ startConfidence: n, startAt: new Date().toISOString() });
            track({ type: "check-in", moment: "start", confidence: n });
          }}
        />
      </section>
    );
  }

  if (step === "thanks") {
    return (
      <section className="flex flex-col gap-2 rounded-2xl border border-mindset/40 bg-navy-800 p-5">
        <p className="text-lg font-semibold text-ink">Thank you.</p>
        <p className="text-sm text-ink-muted">
          You started at {c.startConfidence} out of 10{c.endConfidence !== undefined ? ` and you're now at ${c.endConfidence}` : ""}.
          That&apos;s yours - nobody can take it back off you.
        </p>
      </section>
    );
  }

  // The end: only once they've done the course, and only once.
  if (c.endConfidence !== undefined || !finished(state)) return null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-storytelling/40 bg-navy-800 p-5">
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-storytelling">Looking back</span>
      {step === "confidence" && (
        <>
          <p className="text-lg font-semibold leading-snug text-ink">How confident do you feel speaking on camera now?</p>
          <p className="text-sm text-ink-muted">When you started, you said {c.startConfidence} out of 10.</p>
          <Scale
            from={1}
            to={10}
            value={confidence}
            low="Not at all"
            high="Completely"
            onPick={(n) => {
              setConfidence(n);
              setStep("recommend");
            }}
          />
        </>
      )}
      {step === "recommend" && (
        <>
          <p className="text-lg font-semibold leading-snug text-ink">
            How likely are you to recommend Speak Better to a friend?
          </p>
          <Scale
            from={0}
            to={10}
            low="Not at all likely"
            high="Extremely likely"
            onPick={(n) => {
              checkIn({ endConfidence: confidence, endAt: new Date().toISOString(), recommend: n });
              track({ type: "check-in", moment: "end", confidence, recommend: n });
              setStep("story");
            }}
          />
        </>
      )}
      {step === "story" && (
        <>
          <p className="text-lg font-semibold leading-snug text-ink">What&apos;s changed for you? (optional)</p>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="Six weeks ago I couldn't…"
            className="w-full rounded-xl border border-navy-600 bg-navy-900 p-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
          />
          <label className="flex items-start gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={quoteOk}
              onChange={(e) => setQuoteOk(e.target.checked)}
              className="mt-1 size-4 accent-[var(--color-storytelling)]"
            />
            Speak Better may quote this, without my name.
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                const text = story.trim();
                if (text) {
                  checkIn({ story: text, quoteOk });
                  track({ type: "check-in", moment: "end", story: text, quoteOk });
                }
                setStep("thanks");
              }}
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-navy-900"
            >
              {story.trim() ? "Send" : "Skip"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
