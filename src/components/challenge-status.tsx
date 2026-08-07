"use client";

import { useStore } from "@/lib/store";
import { useChallengeComplete } from "@/components/story-progress";

export function ChallengeStatus({ slug }: { slug: string }) {
  const { ready, attemptsFor } = useStore();
  const isComplete = useChallengeComplete();
  if (!ready) return null;

  const complete = isComplete(slug);
  const tries = attemptsFor(slug).length;

  if (complete) {
    return (
      <span className="shrink-0 rounded-full bg-navy-700 px-2 py-0.5 text-[0.65rem] font-medium text-mindset">
        Complete
      </span>
    );
  }
  if (tries > 0) {
    return (
      <span className="shrink-0 rounded-full bg-navy-700 px-2 py-0.5 text-[0.65rem] font-medium text-storytelling">
        {tries} {tries === 1 ? "attempt" : "attempts"}
      </span>
    );
  }
  return null;
}
