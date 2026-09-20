import { mockReview } from "@/lib/coach/mock";
import type { Attempt } from "@/lib/store";

// The sample review's attempt (/demo/review and its lesson pages): the
// stand-in coach's answer to a third, passed take on the story
// baseline, given the review's full shape. Deterministic, so the review
// page and the lesson pages it opens agree.

export const SAMPLE_SLUG = "story-without-help";
export const SAMPLE_ATTEMPT_ID = "sample-review";

export function sampleAttempt(): Attempt | null {
  const review = mockReview({ challengeSlug: SAMPLE_SLUG, attemptNumber: 3, level: "intermediate", durationSec: 118 });
  if (!review) return null;
  return {
    id: SAMPLE_ATTEMPT_ID,
    challengeSlug: SAMPLE_SLUG,
    at: "2026-09-20T09:30:00.000Z",
    durationSec: 118,
    ...review,
    mock: false,
  };
}
