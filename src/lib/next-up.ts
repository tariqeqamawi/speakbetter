import { challenges, storyPhases, type Challenge } from "@/data/challenges";
import { lessonByVimeoId, type Lesson } from "@/data/lessons";
import { challengeProgress } from "@/lib/challenge-progress";
import type { AppState } from "@/lib/store";

// What one thing should a student do right now? A library of 21
// challenges invites browsing; a single named next action produces
// practice. Everything on Today is built from this.

export interface NextUp {
  challenge: Challenge;
  reason: string;
  /** 0–1 through this challenge already */
  ratio: number;
  action: "start" | "resume" | "again";
}

export function nextUp(state: AppState): NextUp | null {
  // 1. Something already underway beats anything new.
  const inFlight = challenges
    .map((c) => ({ c, p: challengeProgress(c, state) }))
    .filter(({ p }) => !p.passed && p.ratio > 0)
    .sort((a, b) => b.p.ratio - a.p.ratio)[0];

  if (inFlight) {
    return {
      challenge: inFlight.c,
      reason:
        inFlight.p.attempts > 0
          ? "You've attempted this - one more go could pass it."
          : "You warmed up for this but haven't recorded yet.",
      ratio: inFlight.p.ratio,
      action: "resume",
    };
  }

  // 2. Otherwise the first unpassed challenge in journey order.
  const order = storyPhases.map((p) => p.id);
  const untouched = challenges
    .filter((c) => !challengeProgress(c, state).passed)
    .sort((a, b) => order.indexOf(a.phase) - order.indexOf(b.phase))[0];

  if (untouched) {
    const phase = storyPhases.find((p) => p.id === untouched.phase);
    return {
      challenge: untouched,
      reason: `Next in ${phase?.name ?? "your journey"}.`,
      ratio: 0,
      action: "start",
    };
  }

  // 3. Everything passed - send them back to raise a score.
  const weakest = challenges
    .map((c) => ({
      c,
      best: Math.max(
        0,
        ...state.attempts
          .filter((a) => a.challengeSlug === c.slug)
          .map((a) => a.score),
      ),
    }))
    .sort((a, b) => a.best - b.best)[0];

  return weakest
    ? {
        challenge: weakest.c,
        reason: "Every challenge passed. This one has the most room left.",
        ratio: 1,
        action: "again",
      }
    : null;
}

/** The most recent lesson opened but arguably worth finishing. */
export function continueWatching(state: AppState, limit = 4): Lesson[] {
  return [...state.watchedLessons]
    .reverse()
    .map((id) => lessonByVimeoId.get(id))
    .filter((l): l is Lesson => l !== undefined)
    .slice(0, limit);
}
