"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, type Level } from "@/lib/store";
import { LevelIcon, levelMeta } from "@/components/level-icon";

// Onboarding (master plan §09): one plain, human question decides the
// starting level. Level changes stay manual, in the student's hands.
//
// A second question follows it: why they're here at all. The course's
// whole retention layer asks people to keep going - this is the reason
// they gave for wanting to, in their own words, and it sits at the top
// of their dashboard from then on.

const order: Level[] = ["beginner", "intermediate", "advanced"];

const INTENTION_PROMPT =
  "Tell us why you're doing this course. What is the fear you're overcoming, or the outcome you're reaching for? Write it succinctly, and with the full emotional weight of what it means to you - so we can remind you to keep going.";

export default function WelcomePage() {
  const { state, ready, setLevel, setIntention } = useStore();
  const router = useRouter();
  const [step, setStep] = useState<"level" | "intention">("level");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (ready && !state.unlocked) router.replace("/");
  }, [ready, state.unlocked, router]);

  if (!ready || !state.unlocked) return null;

  const finish = () => {
    setIntention(draft);
    router.push("/challenges");
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 py-10">
      <header className="flex flex-col gap-3 text-center">
        <div className="spectrum-rule mx-auto h-1 w-16 rounded-full" />
        <h1 className="text-3xl font-semibold tracking-tight">
          {step === "level" ? "Welcome to Speak Better" : "One more thing"}
        </h1>
        <p className="text-lg text-ink-muted">
          {step === "level"
            ? "How do you feel about speaking?"
            : "Why are you really here?"}
        </p>
        <p className="text-xs text-ink-faint">
          {step === "level"
            ? "This sets your starting level. You can change it any time - it never changes without you."
            : "Only you ever see this. It lives at the top of your dashboard."}
        </p>
      </header>

      {step === "level" ? (
        <div className="flex flex-col gap-3">
          {order.map((level) => {
            const meta = levelMeta[level];
            const active = state.level === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setLevel(level);
                  setStep("intention");
                }}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-ink-faint bg-navy-700"
                    : "border-navy-600 bg-navy-800 hover:border-ink-faint hover:bg-navy-700"
                }`}
              >
                <LevelIcon level={level} className="h-14 w-auto shrink-0" priority />
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold text-ink">
                    &ldquo;{meta.feeling}&rdquo;
                  </span>
                  <span className="text-sm text-ink-muted">
                    <b className={`font-semibold ${meta.accentClass}`}>
                      {meta.label}
                    </b>{" "}
                    - {meta.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl border border-navy-600 bg-navy-800 p-4 text-sm leading-relaxed text-ink-muted">
            {INTENTION_PROMPT}
          </p>
          <label className="flex flex-col gap-2">
            <span className="sr-only">Your reason for taking this course</span>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={280}
              autoFocus
              placeholder="I want to stop shaking when every face in the room turns to me - and say the thing I actually mean."
              className="w-full rounded-xl border border-navy-600 bg-navy-900 p-4 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
            <span className="self-end text-xs tabular-nums text-ink-faint">
              {draft.length}/280
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={finish}
              disabled={draft.trim().length === 0}
              className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Start the journey
            </button>
            <button
              type="button"
              onClick={() => router.push("/challenges")}
              className="text-xs text-ink-faint transition-colors hover:text-ink-muted"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
