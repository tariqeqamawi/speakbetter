"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, type Level } from "@/lib/store";
import { LevelIcon, levelMeta } from "@/components/level-icon";

// Onboarding (master plan §09): one plain, human question decides the
// starting level. Level changes stay manual, in the student's hands.

const order: Level[] = ["beginner", "intermediate", "advanced"];

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
        {order.map((level) => {
          const meta = levelMeta[level];
          const active = state.level === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => {
                setLevel(level);
                router.push("/challenges");
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
                  — {meta.detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
