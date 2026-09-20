"use client";

import { useMemo } from "react";
import { challengeBySlug } from "@/data/challenges";
import { mockReview } from "@/lib/coach/mock";
import { useStore, type Attempt } from "@/lib/store";
import { Feedback } from "@/components/practice-panel";

// The feedback page with a sample review in it - the stand-in coach's
// answer to a passed take on the story baseline, given the full shape
// (what worked, the spectrum, the lessons, the skills spotted, for next
// time, the verdict) so every section is there to look at.

const SLUG = "story-without-help";

export function SampleReview() {
  const { ready } = useStore();
  const challenge = challengeBySlug.get(SLUG)!;
  const attempt = useMemo<Attempt | null>(() => {
    // Attempt three, so the stand-in coach scores it a pass.
    const review = mockReview({ challengeSlug: SLUG, attemptNumber: 3, level: "intermediate", durationSec: 118 });
    if (!review) return null;
    return {
      id: "sample-review",
      challengeSlug: SLUG,
      at: new Date().toISOString(),
      durationSec: 118,
      ...review,
      mock: false,
    };
  }, []);
  if (!ready || !attempt) return null;

  return (
    <div className="flex flex-col gap-4 py-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">A sample review · {challenge.title}</p>
        <h1 className="text-2xl font-semibold tracking-tight">The feedback page</h1>
        <p className="max-w-lg text-sm text-ink-muted">
          The review as a student sees it after a take - tap a title to open or fold it. The words are the stand-in
          coach&apos;s, not a real review.
        </p>
      </header>
      <Feedback attempt={attempt} videoUrl="" challenge={challenge} onDone={() => {}} preview />
    </div>
  );
}
