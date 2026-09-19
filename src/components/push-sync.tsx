"use client";

import { useEffect } from "react";
import { useStore, type Attempt } from "@/lib/store";
import { fetchKeptReview, pendingReview, reportPush, setPendingReview } from "@/lib/push-client";

// Runs on each open of the app: sends the device's current figures to
// the push service (only while notes are on), and picks up a review
// the coach finished after the student left the page.

export function PushSync() {
  const { state, ready, recordAttempt } = useStore();

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      reportPush(state);
      const pending = pendingReview();
      if (!pending) return;
      // Older than a day, it's not coming: forget it.
      if (Date.now() - Date.parse(pending.at) > 24 * 3600_000) {
        setPendingReview(null);
        return;
      }
      if (state.attempts.some((a) => a.id === pending.attemptId)) {
        setPendingReview(null);
        return;
      }
      fetchKeptReview(pending).then((kept) => {
        if (!kept) return;
        const r = kept as unknown as Omit<Attempt, "id" | "challengeSlug" | "at" | "durationSec">;
        recordAttempt({
          id: pending.attemptId,
          challengeSlug: pending.challengeSlug,
          at: pending.at,
          durationSec: pending.durationSec,
          passed: r.passed,
          score: r.score,
          spectrum: r.spectrum,
          focus: r.focus,
          fullNotes: r.fullNotes,
          summary: r.summary,
          briefVerdict: r.briefVerdict,
          criteria: r.criteria,
          lessonsUsed: r.lessonsUsed,
          skillsSpotted: r.skillsSpotted,
          strengths: r.strengths,
          spoken: r.spoken,
        });
        setPendingReview(null);
      });
    }, 1500);
    return () => window.clearTimeout(t);
    // Once per open, when the store is ready - not on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return null;
}
