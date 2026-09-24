import type { AppState } from "@/lib/store";
import { isPlan, type Plan } from "@/data/pricing";
import { includedReviews, LOW_AT } from "@/data/credits";

// What a student's plan lets them do (data/pricing.ts). There are two
// ways to be coached, and the difference is the voice:
//
//   WRITTEN   Starter. Coach watches every take and writes the review -
//             the score, the spectrum, the notes, the lessons - and
//             the student reads it. No spoken review, no asking him
//             questions.
//   SPOKEN    Complete and VIP Ultimate. Everything above, said aloud
//             in his voice, plus Ask Coach whenever they want him.
//
// Without a paid plan there is no app at all - no free tier, no trial -
// and the gate (components/require-access.tsx) sends them to the tiers.
// States from before plans existed count as the full experience.

/** The tier they paid for, or null for somebody who hasn't. A stored
 *  plan the app no longer sells ("trial") is null too. */
export function planOf(state: Pick<AppState, "plan" | "unlocked">): Plan | null {
  if (!state.unlocked) return null;
  if (state.plan === undefined) return "coached";
  return isPlan(state.plan) ? state.plan : null;
}

/** Coach's voice, and Coach on demand - the full experience. */
export function hasCoach(state: Pick<AppState, "plan" | "unlocked">): boolean {
  const p = planOf(state);
  return p === "coached" || p === "founders";
}

/** Coach watches the video and writes the review. Every paid plan does
 *  this. */
export function coachWatches(state: Pick<AppState, "plan" | "unlocked">): boolean {
  return planOf(state) !== null;
}

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
  const plan = planOf(state);
  const allowance = plan ? includedReviews[plan] : 0;
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
