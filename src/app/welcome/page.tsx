"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, type Level } from "@/lib/store";

// Onboarding (master plan §09): one plain, human question decides the
// starting level. Level changes stay manual, in the student's hands.

const options: { level: Level; feeling: string; label: string; detail: string }[] = [
  {
    level: "beginner",
    feeling: "Nervous and shy",
    label: "Beginner",
    detail:
      "Feedback stays focused — two or three things at a time, never a wall of notes.",
  },
  {
    level: "intermediate",
    feeling: "Fairly confident",
    label: "Intermediate",
    detail:
      "Focused feedback, plus the option to see everything the AI noticed.",
  },
  {
    level: "advanced",
    feeling: "Very confident — give me a stage",
    label: "Advanced",
    detail:
      "The most demanding thresholds. Near full-spectrum talks are the bar.",
  },
];

export default function WelcomePage() {
  const { state, ready, setLevel } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.unlocked) router.replace("/");
  }, [ready, state.unlocked, router]);

  if (!ready || !state.unlocked) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 py-10">
      <header className="flex flex-col gap-3 text-center">
        <div className="spectrum-rule mx-auto h-1 w-16 rounded-full" />
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome to Speak Better
        </h1>
        <p className="text-lg text-ink-muted">How do you feel about speaking?</p>
        <p className="text-xs text-ink-faint">
          This sets your starting level. You can change it any time — it never
          changes without you.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <button
            key={option.level}
            type="button"
            onClick={() => {
              setLevel(option.level);
              router.push("/challenges");
            }}
            className="flex flex-col gap-1 rounded-xl border border-navy-600 bg-navy-800 p-5 text-left transition-colors hover:border-ink-faint hover:bg-navy-700"
          >
            <span className="font-semibold text-ink">“{option.feeling}”</span>
            <span className="text-sm text-ink-muted">
              <b className="font-medium text-ink-muted">{option.label}</b> —{" "}
              {option.detail}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
