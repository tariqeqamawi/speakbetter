import type { CategoryId } from "@/data/categories";
import { challenges } from "@/data/challenges";
import { challengeProgress } from "@/lib/challenge-progress";
import type { AppState } from "@/lib/store";

// Skills open gradually. A new student who walked straight into
// Storytelling met the storybook lessons cold, felt they had missed
// something, and stopped. So until challenge 1 is done - five Presence
// lessons, watched - Presence is the only colour open, and Skills opens
// on it. Five lessons watched, or the challenge passed, opens the rest.
// (Either, so a student who watched lessons before this rule existed
// isn't locked out of a library they were already using.)

/** The colour every student starts in. */
export const FIRST_COLOUR: CategoryId = "mindset";
/** Lessons watched that open the other colours. */
export const OPEN_AFTER = 5;

export function skillsOpen(state: AppState): boolean {
  return state.watchedLessons.length >= OPEN_AFTER || challengeProgress(challenges[0], state).passed;
}

export function colourOpen(state: AppState, category: string): boolean {
  return category === FIRST_COLOUR || skillsOpen(state);
}
