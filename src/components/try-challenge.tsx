"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { challengeBySlug } from "@/data/challenges";
import { PracticePanel } from "@/components/practice-panel";
import { useStore } from "@/lib/store";

// TRY IT, on the landing page: the first challenge - the speaking
// baseline - for real. Record (or upload) a minute of yourself and Coach
// reviews it, exactly as a student's take is reviewed. Runs on the
// landing page's throwaway store, so nothing is saved; the review is the
// point - hearing Coach on your own video is the moment it clicks.
//
// ONE PER VISITOR. Each review is a real, paid one, so once a visitor
// has had theirs it's remembered in their browser, and coming back they
// find the way in instead of the recorder. (A browser-level limit: it
// stops the casual second, third and tenth try, not a determined one.)

const SLUG = "speaking-baseline";
const USED_KEY = "sb-free-review-used";

export function TryChallenge() {
  const challenge = challengeBySlug.get(SLUG);
  const { state } = useStore();
  // Reviewed on this visit: the panel keeps showing it.
  const reviewedNow = state.attempts.some((a) => a.challengeSlug === SLUG);
  // Reviewed on an earlier visit: the way in, instead.
  const [usedBefore, setUsedBefore] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(USED_KEY)) {
        const t = window.setTimeout(() => setUsedBefore(true), 0);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (!reviewedNow) return;
    try {
      localStorage.setItem(USED_KEY, "1");
    } catch {}
  }, [reviewedNow]);

  if (!challenge) return null;
  const spent = usedBefore && !reviewedNow;
  return (
    <section className="flex flex-col items-center gap-4">
      <div className="flex max-w-xl flex-col items-center gap-2 text-center">
        <span className="rounded-full border border-mindset/50 bg-mindset/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-mindset">
          Free
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Try the first challenge - Coach reviews it</h2>
        <p className="text-ink-muted text-balance">
          {spent
            ? "You've had your free review. The rest of the challenges - and Coach on every one - are inside."
            : "Talk to your phone for a minute about anything. Coach watches it and tells you what you did well and what to work on. Nothing is kept."}
        </p>
      </div>
      {spent ? (
        <Link
          href="#pricing"
          data-track="try-used"
          className="rounded-full bg-figurative px-6 py-3 text-sm font-bold text-navy-950 shadow-[0_0_24px_-6px_var(--color-figurative)]"
        >
          Join to keep going
        </Link>
      ) : (
        <div className="w-full max-w-xl rounded-2xl border border-navy-600 bg-navy-900/60 p-4 sm:p-5" data-track="try">
          <PracticePanel challenge={challenge} bar={false} />
        </div>
      )}
    </section>
  );
}
