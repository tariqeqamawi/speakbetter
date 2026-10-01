"use client";

import { challengeBySlug } from "@/data/challenges";
import { PracticePanel } from "@/components/practice-panel";

// TRY IT, on the landing page: the first challenge - the speaking
// baseline - for real. Record (or upload) a minute of yourself and Coach
// reviews it, exactly as a student's take is reviewed. Runs on the
// landing page's throwaway store, so nothing is saved; the review is the
// point - hearing Coach on your own video is the moment it clicks.

const SLUG = "speaking-baseline";

export function TryChallenge() {
  const challenge = challengeBySlug.get(SLUG);
  if (!challenge) return null;
  return (
    <section className="flex flex-col items-center gap-4">
      <div className="flex max-w-xl flex-col items-center gap-2 text-center">
        <span className="rounded-full border border-mindset/50 bg-mindset/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-mindset">
          Free
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Try the first challenge - Coach reviews it</h2>
        <p className="text-ink-muted text-balance">
          Talk to your phone for a minute about anything. Coach watches it and tells you what you did well and what to
          work on. Nothing is kept.
        </p>
      </div>
      <div className="w-full max-w-xl rounded-2xl border border-navy-600 bg-navy-900/60 p-4 sm:p-5" data-track="try">
        <PracticePanel challenge={challenge} bar={false} />
      </div>
    </section>
  );
}
