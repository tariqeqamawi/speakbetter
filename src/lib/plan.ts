import type { AppState } from "@/lib/store";
import type { Plan } from "@/data/pricing";
import { challenges, type Challenge } from "@/data/challenges";

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
