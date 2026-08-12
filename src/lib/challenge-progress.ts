import type { Challenge } from "@/data/challenges";
import type { AppState } from "@/lib/store";

// How far through a challenge a student is. A challenge isn't one action
// but a short sequence — warm up on the related skills, record an
// attempt, then pass it — so progress is weighted across those three
// rather than being all-or-nothing.

const WARM_UP_WEIGHT = 0.35;
const ATTEMPT_WEIGHT = 0.3;
const PASS_WEIGHT = 0.35;

export interface ChallengeProgress {
  /** 0–1 */
  ratio: number;
  attempts: number;
  passed: boolean;
  warmUpWatched: number;
  warmUpTotal: number;
  /** What the primary button should say */
  action: "start" | "resume" | "again";
}

export function challengeProgress(
  challenge: Challenge,
  state: AppState,
): ChallengeProgress {
  const warmUpTotal = challenge.relatedLessonIds.length;
  const warmUpWatched = challenge.relatedLessonIds.filter((id) =>
    state.watchedLessons.includes(id),
  ).length;
  const attemptsFor = state.attempts.filter(
    (a) => a.challengeSlug === challenge.slug,
  );
  const passed = attemptsFor.some((a) => a.passed);

  // The passive Mindset Toolbox is completed purely by watching.
  if (challenge.passive) {
    const ratio = warmUpTotal === 0 ? 0 : warmUpWatched / warmUpTotal;
    return {
      ratio,
      attempts: 0,
      passed: ratio === 1,
      warmUpWatched,
      warmUpTotal,
      action: ratio === 0 ? "start" : ratio === 1 ? "again" : "resume",
    };
  }

  const warmUpRatio = warmUpTotal === 0 ? 1 : warmUpWatched / warmUpTotal;
  const ratio = Math.min(
    1,
    warmUpRatio * WARM_UP_WEIGHT +
      (attemptsFor.length > 0 ? ATTEMPT_WEIGHT : 0) +
      (passed ? PASS_WEIGHT : 0),
  );

  return {
    ratio,
    attempts: attemptsFor.length,
    passed,
    warmUpWatched,
    warmUpTotal,
    action: passed ? "again" : ratio === 0 ? "start" : "resume",
  };
}

export const actionLabel: Record<ChallengeProgress["action"], string> = {
  start: "Start challenge",
  resume: "Resume challenge",
  again: "Practice again",
};
