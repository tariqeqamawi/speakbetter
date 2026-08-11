"use client";

import Link from "next/link";
import { useStore, type Level } from "@/lib/store";
import { categories, type CategoryId } from "@/data/categories";
import { challenges } from "@/data/challenges";
import { currentStreak } from "@/data/badges";
import { SpectrumBars } from "@/components/spectrum";
import { BadgeIcon } from "@/components/icons";
import { useChallengeComplete } from "@/components/story-progress";

// The student's own corner of the app: where they stand, what they've
// earned, and the only place the level is changed (master plan §09 —
// movement between levels is always manual).

const levels: { id: Level; label: string; detail: string }[] = [
  {
    id: "beginner",
    label: "Beginner",
    detail: "Focused feedback — two or three things at a time.",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    detail: "Focused feedback, plus the full set of coach notes on request.",
  },
  {
    id: "advanced",
    label: "Advanced",
    detail: "Hardest thresholds. Near full-spectrum talks are the bar.",
  },
];

export default function ProfilePage() {
  const { state, ready, setLevel, attemptsFor } = useStore();
  const isComplete = useChallengeComplete();

  if (!ready) return null;

  const completed = challenges.filter((c) => isComplete(c.slug)).length;
  const streak = currentStreak(state);

  // Best score seen in each color across every attempt — the student's
  // demonstrated range, not just their latest talk.
  const bestSpectrum = {} as Record<CategoryId, number>;
  for (const cat of categories) {
    bestSpectrum[cat.id] = state.attempts.reduce(
      (best, a) => Math.max(best, a.spectrum[cat.id] ?? 0),
      0,
    );
  }
  const colorsReached = categories.filter((c) => bestSpectrum[c.id] >= 40).length;

  const stats = [
    { label: "Challenges complete", value: `${completed}/${challenges.length}` },
    { label: "Videos uploaded", value: state.attempts.length },
    { label: "Colors reached", value: `${colorsReached}/7` },
    { label: "Day streak", value: streak },
  ];

  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="max-w-lg text-ink-muted">
          Where you stand, what you&apos;ve earned, and how you want to be
          coached.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-xl border border-navy-600 bg-navy-800 p-4"
          >
            <span className="text-2xl font-bold tabular-nums text-ink">
              {stat.value}
            </span>
            <span className="text-xs text-ink-faint">{stat.label}</span>
          </div>
        ))}
      </section>

      {state.attempts.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
              Your range
            </h2>
            <p className="text-sm text-ink-muted">
              The strongest each color has ever shown up across all your
              attempts.
            </p>
          </div>
          <div className="rounded-xl border border-navy-600 bg-navy-800 p-4">
            <SpectrumBars spectrum={bestSpectrum} />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
            Your level
          </h2>
          <p className="text-sm text-ink-muted">
            This changes how hard the challenges push and how much detail your
            coach gives back. It only ever changes when you change it.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {levels.map((level) => {
            const active = state.level === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setLevel(level.id)}
                aria-pressed={active}
                className={`flex flex-col gap-0.5 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-ink-faint bg-navy-700"
                    : "border-navy-600 bg-navy-800 hover:bg-navy-700"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-ink">
                  {level.label}
                  {active && (
                    <span className="rounded-full bg-navy-600 px-2 py-0.5 text-[0.65rem] font-medium text-ink-muted">
                      Current
                    </span>
                  )}
                </span>
                <span className="text-sm text-ink-muted">{level.detail}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
          Badges
        </h2>
        {state.badges.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-navy-600 p-4">
            <p className="text-sm text-ink-faint">
              No badges yet — your first arrives the moment you upload a video.
            </p>
            <Link
              href="/challenges"
              className="flex min-h-11 items-center rounded-lg border border-navy-600 px-4 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Start a challenge
            </Link>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {state.badges.map((badge) => (
              <li
                key={badge.id}
                className="flex items-start gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4"
              >
                <span className="mt-0.5 text-ink-muted" aria-hidden>
                  <BadgeIcon name={badge.icon} className="size-6" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">
                    {badge.title}
                  </span>
                  <span className="text-xs text-ink-muted">{badge.message}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {state.attempts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
            Recent attempts
          </h2>
          <ul className="flex flex-col gap-2">
            {[...state.attempts]
              .reverse()
              .slice(0, 8)
              .map((attempt) => {
                const challenge = challenges.find(
                  (c) => c.slug === attempt.challengeSlug,
                );
                const tries = attemptsFor(attempt.challengeSlug).length;
                return (
                  <li key={attempt.id}>
                    <Link
                      href={`/challenges/${attempt.challengeSlug}`}
                      className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-4 py-3 transition-colors hover:bg-navy-700"
                    >
                      <span className="flex-1 text-sm font-medium text-ink">
                        {challenge?.title ?? attempt.challengeSlug}
                        <span className="ml-2 text-xs font-normal text-ink-faint">
                          {new Date(attempt.at).toLocaleDateString()}
                          {tries > 1 && ` · ${tries} attempts`}
                        </span>
                      </span>
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          attempt.passed ? "text-mindset" : "text-storytelling"
                        }`}
                      >
                        {attempt.score}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </div>
  );
}
