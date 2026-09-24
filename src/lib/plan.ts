import type { AppState } from "@/lib/store";
import type { Plan } from "@/data/pricing";
import { challenges, type Challenge } from "@/data/challenges";
import { includedReviews, LOW_AT } from "@/data/credits";

// What a student's plan lets them do (data/pricing.ts). There are two
// ways to be coached, and the difference is the voice:
//
//   WRITTEN   Starter. Coach watches every take and writes the review -
//             the score, the spectrum, the notes, the lessons - and
//             the student reads it. No spoken review, no asking him
//             questions.
//   SPOKEN    Full Experience and Ultimate, and the free first review.
//             Everything above, said aloud in his voice, plus Ask
//             Coach whenever they want him.
//
// The free baseline is the spoken experience once, on the two baseline
// challenges, so what's being offered is what they'd be buying.
// States from before plans existed count as the full experience.

export function planOf(state: Pick<AppState, "plan" | "unlocked">): Plan {
  return state.plan ?? (state.unlocked ? "coached" : "trial");
}

/** Coach's voice, and Coach on demand - the full experience. */
export function hasCoach(state: Pick<AppState, "plan" | "unlocked">): boolean {
  const p = planOf(state);
  return p === "coached" || p === "founders";
}

/** Coach watches the video and writes the review. Every paid plan does
 *  this; the free baseline does it for its one review. */
export function coachWatches(state: Pick<AppState, "plan" | "unlocked">): boolean {
  const p = planOf(state);
  return p === "foundations" || p === "coached" || p === "founders" || p === "trial";
}

export function onTrial(state: Pick<AppState, "plan" | "unlocked">): boolean {
  return planOf(state) === "trial";
}

/** The baseline's lessons - what the free baseline can watch. */
const trialLessonIds = new Set(challenges.filter((c) => c.baseline).flatMap((c) => c.relatedLessonIds));

export function trialAllowsChallenge(challenge: Pick<Challenge, "baseline">): boolean {
  return Boolean(challenge.baseline);
}

export function trialAllowsLesson(vimeoId: string): boolean {
  return trialLessonIds.has(vimeoId);
}

/** Real reviews the trial has used - it gets one. */
export function trialReviewsUsed(state: Pick<AppState, "attempts">): number {
  return state.attempts.filter((a) => !a.mock).length;
}

export const TRIAL_REVIEWS = 1;

/**
 * Reviews left: what the plan included, plus anything topped up,
 * minus what has been spent.
 *
 * A review is spent when Coach actually watches a take - a mock review
 * costs nothing and is not counted. The allowance is deliberately
 * larger than ordinary practice needs (a take a day for six weeks is
 * 42) so that nobody doing the course as intended ever meets this;
 * it exists for the evening somebody re-records the same challenge
 * eleven times, which is the case that makes an unlimited plan
 * impossible to offer honestly.
 */
export function reviewsLeft(state: Pick<AppState, "plan" | "unlocked" | "attempts" | "creditsBought">): number {
  const allowance = includedReviews[planOf(state)] ?? 0;
  const bought = state.creditsBought ?? 0;
  const spent = state.attempts.filter((a) => !a.mock).length;
  return Math.max(0, allowance + bought - spent);
}

/** Worth warning about, but not yet blocking. */
export function reviewsRunningLow(
  state: Pick<AppState, "plan" | "unlocked" | "attempts" | "creditsBought">,
): boolean {
  const left = reviewsLeft(state);
  return left > 0 && left <= LOW_AT;
}
