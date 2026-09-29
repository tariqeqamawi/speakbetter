import type { Challenge } from "@/data/challenges";
import type { AppState } from "@/lib/store";

// How far through a challenge a student is. A challenge isn't one action
// but a short sequence - warm up on the related skills, record an
// attempt, then pass it - so progress is weighted across those three
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

/** Where a watch-only challenge stands. */
export interface WatchProgress {
  /** How many lessons finish it. */
  needed: number;
  /** Lessons that count: watched within the challenge (or, for one that
   *  asks for every lesson, watched at all). */
  counted: string[];
  /** Lessons watched before the student reached it - no credit here. */
  before: string[];
  done: boolean;
}

/**
 * The one rule for the challenges completed by watching. Every place
 * that asks "is it done" or "how far through" comes here, so the rule
 * can't drift between the road, the badges and the page.
 *
 * Asked for every lesson (Presence): each one, watched whenever.
 * Asked for some (`watchCount`): that many, watched WITHIN the
 * challenge - the lessons already watched when the student reached it
 * (the snapshot in `watchStarts`, taken by the store) don't count, so
 * somebody who had watched three must watch five more. If fewer than
 * that are left unwatched, the ones left are enough; if none are left,
 * it's done the moment they arrive.
 */
export function watchProgress(
  challenge: Challenge,
  state: Pick<AppState, "watchedLessons" | "watchStarts">,
): WatchProgress {
  const ids = challenge.relatedLessonIds;
  const watched = new Set(state.watchedLessons);
  if (!challenge.watchCount) {
    const counted = ids.filter((id) => watched.has(id));
    return { needed: ids.length, counted, before: [], done: ids.length > 0 && counted.length === ids.length };
  }
  // Not reached yet: nothing counts until it is, so everything watched
  // so far is "before".
  const start = new Set(state.watchStarts?.[challenge.slug] ?? state.watchedLessons);
  const before = ids.filter((id) => start.has(id));
  const counted = ids.filter((id) => watched.has(id) && !start.has(id));
  const needed = Math.min(challenge.watchCount, ids.length - before.length);
  return { needed, counted, before, done: counted.length >= needed };
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

  // The challenges completed purely by watching (watchProgress).
  if (challenge.passive) {
    const w = watchProgress(challenge, state);
    const ratio = w.done ? 1 : w.needed === 0 ? 0 : w.counted.length / w.needed;
    return {
      ratio,
      attempts: 0,
      passed: w.done,
      warmUpWatched: w.counted.length,
      warmUpTotal: w.needed,
      action: w.done ? "again" : w.counted.length === 0 ? "start" : "resume",
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
