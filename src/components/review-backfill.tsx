"use client";

import { useEffect, useState } from "react";
import { useStore, type Attempt } from "@/lib/store";
import { takeHistory } from "@/components/practice-panel";

// An older review, filled in (lib/coach/backfill.ts). The first reviews
// were kept without "What worked", the cited lessons judged, the skills
// used without being asked and "Since you started". The first time one
// is opened, those sections are written from its own record and saved
// into it - once, then never asked again.

/** A review from before those sections existed, not yet filled in. */
export function needsBackfill(a: Attempt): boolean {
  return !a.backfilled && a.strengths === undefined && a.lessonsUsed === undefined;
}

/** One ask per review per visit, however often it's opened. */
const asked = new Set<string>();

export function useReviewBackfill(attempt: Attempt | undefined): boolean {
  const { state, fillAttempt } = useStore();
  const [filling, setFilling] = useState(false);
  const id = attempt?.id;
  const needed = attempt ? needsBackfill(attempt) : false;

  useEffect(() => {
    if (!attempt || !needed || asked.has(attempt.id)) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    asked.add(attempt.id);
    const earlier = state.attempts.filter((a) => a.at < attempt.at);
    Promise.resolve()
      .then(() => setFilling(true))
      .then(() => fetch("/api/review/backfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeSlug: attempt.challengeSlug,
        score: attempt.score,
        passed: attempt.passed,
        durationSec: attempt.durationSec,
        spectrum: attempt.spectrum,
        summary: attempt.summary,
        spoken: attempt.spoken,
        briefVerdict: attempt.briefVerdict,
        focus: attempt.focus,
        fullNotes: attempt.fullNotes,
        criteria: attempt.criteria,
        moments: attempt.moments,
        observations: attempt.observations,
        history: takeHistory(earlier),
        // The stand-in coach's sample words aren't a record to reason
        // from: read them off the notes, no model.
        deriveOnly: Boolean(attempt.mock),
      }),
    }))
      .then((res) => (res.ok ? res.json() : null))
      .then((fill) => {
        if (!fill) return;
        fillAttempt(attempt.id, {
          strengths: fill.strengths,
          lessonsUsed: fill.lessonsUsed,
          skillsSpotted: fill.skillsSpotted,
          ...(fill.progress ? { progress: fill.progress } : {}),
        });
      })
      .catch(() => {
        // Offline or refused: the review stays as it was, and the next
        // visit asks again.
        asked.delete(attempt.id);
      })
      .finally(() => setFilling(false));
    // One run per review; the attempt object changes when it's filled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, needed]);

  return filling;
}

/** Where the new sections will land, while Coach writes them. */
export function BackfillPending() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy-600 bg-navy-900/60 p-4" aria-live="polite">
      <p className="text-sm font-medium text-ink-muted">Coach is filling in this older review…</p>
      {["What worked", "The lessons this challenge asked for", "Skills you used without being asked"].map((t) => (
        <div key={t} className="flex flex-col gap-2 rounded-lg border border-navy-700 p-3">
          <span className="text-sm font-semibold text-ink-faint">{t}</span>
          <span className="h-2 w-3/4 animate-pulse rounded-full bg-navy-700" />
          <span className="h-2 w-1/2 animate-pulse rounded-full bg-navy-700" />
        </div>
      ))}
    </div>
  );
}
