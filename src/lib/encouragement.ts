import { categories } from "@/data/categories";
import { challenges } from "@/data/challenges";
import { challengeProgress } from "@/lib/challenge-progress";
import { currentStreak } from "@/data/badges";
import type { AppState } from "@/lib/store";

// Everything the coach is allowed to say something about. Each figure is
// measured from the student's own record — the coach never congratulates
// anyone on something that didn't happen.

export interface EncouragementContext {
  percentComplete: number;
  challengesPassed: number;
  challengesTotal: number;
  uploads: number;
  streak: number;
  /** Colors lit in their most recent talk */
  colorsNow: number;
  /** Colors lit in their earliest talk, for a genuine comparison */
  colorsThen: number;
  /** Score change between first and latest attempt */
  scoreThen: number;
  scoreNow: number;
  /** Most attempts on any single challenge — persistence */
  mostAttemptsOnOne: number;
  /** Colors never yet reached, so the coach can point somewhere real */
  missingColors: string[];
  daysSinceFirst: number;
}

export function buildContext(state: AppState): EncouragementContext | null {
  if (state.attempts.length === 0) return null;

  const attempts = [...state.attempts].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
  const first = attempts[0];
  const latest = attempts[attempts.length - 1];
  const lit = (a: typeof first) =>
    categories.filter((c) => (a.spectrum[c.id] ?? 0) >= 40).length;

  const passed = challenges.filter((c) => challengeProgress(c, state).passed).length;

  const counts = new Map<string, number>();
  for (const a of attempts) {
    counts.set(a.challengeSlug, (counts.get(a.challengeSlug) ?? 0) + 1);
  }

  const everReached = new Set(
    categories
      .filter((c) => attempts.some((a) => (a.spectrum[c.id] ?? 0) >= 40))
      .map((c) => c.id),
  );

  return {
    percentComplete: Math.round((passed / challenges.length) * 100),
    challengesPassed: passed,
    challengesTotal: challenges.length,
    uploads: attempts.length,
    streak: currentStreak(state),
    colorsNow: lit(latest),
    colorsThen: lit(first),
    scoreThen: first.score,
    scoreNow: latest.score,
    mostAttemptsOnOne: Math.max(...counts.values()),
    missingColors: categories
      .filter((c) => !everReached.has(c.id))
      .map((c) => c.name),
    daysSinceFirst: Math.max(
      0,
      Math.round((Date.now() - Date.parse(first.at)) / 86_400_000),
    ),
  };
}
