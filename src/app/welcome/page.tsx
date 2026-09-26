"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, type Level } from "@/lib/store";
import { LevelIcon, levelMeta } from "@/components/level-icon";
import { startTour } from "@/components/guided-tour";
import { PAYWALL_ON } from "@/lib/plan";
import { CoachSays } from "@/components/coach-says";
import {
  INTENTION_AUDIO,
  INTENTION_SPEECH,
  WELCOME_AUDIO,
  WELCOME_SPEECH,
} from "@/data/welcome-speech";

// Onboarding (master plan §09): one plain, human question decides the
// starting level. Level changes stay manual, in the student's hands.
//
// A second question follows it: why they're here at all. The course's
// whole retention layer asks people to keep going - this is the reason
// they gave for wanting to, in their own words, and it sits at the top
// of their dashboard from then on.

const order: Level[] = ["beginner", "intermediate", "advanced"];

export default function WelcomePage() {
  const { state, ready, setLevel, setIntention, unlock } = useStore();
  const router = useRouter();
  const [step, setStep] = useState<"level" | "intention">("level");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!ready || state.unlocked) return;
    // While the paywall is off (lib/plan.ts) the app is open: in they
    // come, with the full experience. On, they need a tier first.
    if (PAYWALL_ON) router.replace("/#pricing");
    else unlock("founders");
  }, [ready, state.unlocked, router, unlock]);

  if (!ready || !state.unlocked) return null;

  // The end of welcome is when a new student is most ready to be shown
  // around - not the next time they happen to open Today. The tour
  // starts on Today, so that's where they're sent.
  const finish = (withTour: boolean) => {
    setIntention(draft);
    router.push("/");
    if (withTour) window.setTimeout(startTour, 600);
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 py-10">
      <header className="flex flex-col gap-3 text-center">
        <div className="spectrum-rule mx-auto h-1 w-16 rounded-full" />
        <h1 className="text-3xl font-semibold tracking-tight">
          {step === "level" ? "Welcome to Speak Better" : "Tell us why you're here"}
        </h1>
      </header>

      {/* Coach does the talking on both steps. A heading and two radio
          buttons is a form; the lion saying it is a welcome - and the
          second question gets a far better answer when somebody asks
          it than when a label does. */}
      <CoachSays
        text={step === "level" ? WELCOME_SPEECH : INTENTION_SPEECH}
        audioSrc={step === "level" ? WELCOME_AUDIO : INTENTION_AUDIO}
      />

      <p className="text-center text-xs text-ink-faint">
        {step === "level"
          ? "You can change your level at any time - it never changes without you."
          : "Only you ever see this. It lives at the top of your dashboard."}
      </p>

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
                  <span className="text-xs leading-snug text-ink-faint">{meta.looksFor}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
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
          {/* One button: send the reason, and straight into the tour -
              which can be skipped, or skipped through, from inside it. */}
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={draft.trim().length === 0}
            className="coach-pill flex min-h-12 items-center justify-center rounded-full text-sm font-bold text-navy-950 disabled:opacity-40"
          >
            <span className="text-navy-950">Send it</span>
          </button>
        </div>
      )}
    </div>
  );
}
