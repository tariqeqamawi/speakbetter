import type { AppState } from "@/lib/store";
import type { Plan } from "@/data/pricing";
import { challenges, type Challenge } from "@/data/challenges";

// What a student's plan lets them do (data/pricing.ts). The free
// baseline: the two baseline challenges, the lessons they lean on, and
// one real review. Foundations: the whole course with the standing
// coach's written feedback, no video review. Coached and Founders:
// everything. States from before plans existed count as Coached.

export function planOf(state: Pick<AppState, "plan" | "unlocked">): Plan {
  return state.plan ?? (state.unlocked ? "coached" : "trial");
}

/** The AI coach watches the video - Coached and Founders. */
export function hasCoach(state: Pick<AppState, "plan" | "unlocked">): boolean {
  const p = planOf(state);
  return p === "coached" || p === "founders";
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
