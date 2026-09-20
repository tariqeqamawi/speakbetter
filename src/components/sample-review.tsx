"use client";

import { useMemo } from "react";
import { challengeBySlug } from "@/data/challenges";
import { useStore } from "@/lib/store";
import { Feedback } from "@/components/practice-panel";
import { SAMPLE_SLUG, SAMPLE_ATTEMPT_ID, sampleAttempt } from "@/lib/sample-attempt";
import { ReviewLessonPage } from "@/components/review-lesson-page";

// The feedback page with a sample review in it - the stand-in coach's
// answer to a passed take on the story baseline, given the full shape
// (what worked, the spectrum, the lessons, the skills spotted, for next
// time, the verdict) so every section is there to look at.

export function SampleReview() {
  const { ready } = useStore();
  const challenge = challengeBySlug.get(SAMPLE_SLUG)!;
  const attempt = useMemo(() => sampleAttempt(), []);
  if (!ready || !attempt) return null;

  return (
    <div className="flex flex-col gap-4 py-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">A sample review · {challenge.title}</p>
        <h1 className="text-2xl font-semibold tracking-tight">The feedback page</h1>
        <p className="max-w-lg text-sm text-ink-muted">
          The review as a student sees it after a take - tap a title to open or fold it, and tap a lesson to see how
          it opens from a review. The words are the stand-in coach&apos;s, not a real review.
        </p>
      </header>
      <Feedback attempt={attempt} videoUrl="" challenge={challenge} onDone={() => {}} preview revisit />
    </div>
  );
}

/** A lesson opened from the sample review - the review's own lesson
 *  page, backed by the same sample attempt. */
export function SampleReviewLesson({ vimeoId }: { vimeoId: string }) {
  const attempt = useMemo(() => sampleAttempt(), []);
  if (!attempt) return null;
  return <ReviewLessonPage id={SAMPLE_ATTEMPT_ID} vimeoId={vimeoId} sample={{ attempt, backHref: "/demo/review" }} />;
}
