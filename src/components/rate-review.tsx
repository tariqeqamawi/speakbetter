"use client";

import { useState } from "react";
import { useStore, type Attempt } from "@/lib/store";
import { CONSENT_LINE, REVIEW_RATINGS, track, type ReviewRating } from "@/lib/insights";

// "How did Coach do?" under every review. Three answers - spot on, partly
// right, way off the mark - and, when he missed, one optional line on
// what he missed: the single most useful thing for making him better.

export function RateReview({ attempt, challengeSlug }: { attempt: Attempt; challengeSlug: string }) {
  const { state, rateAttempt } = useStore();
  const [note, setNote] = useState(attempt.ratingNote ?? "");
  const [sent, setSent] = useState(Boolean(attempt.ratingNote));
  const chosen = attempt.rating;

  const pick = (r: ReviewRating) => {
    rateAttempt(attempt.id, r);
    track({ type: "review-rating", attemptId: attempt.id, challenge: challengeSlug, level: state.level ?? "beginner", rating: r });
    setSent(false);
  };
  const send = () => {
    if (!chosen || !note.trim()) return;
    rateAttempt(attempt.id, chosen, note.trim());
    track({
      type: "review-rating",
      attemptId: attempt.id,
      challenge: challengeSlug,
      level: state.level ?? "beginner",
      rating: chosen,
      note: note.trim(),
    });
    setSent(true);
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-4">
      <h3 className="text-sm font-semibold text-ink">How did Coach do on this review?</h3>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rate this review">
        {REVIEW_RATINGS.map((r) => {
          const on = chosen === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(r.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                on ? "border-ink bg-ink text-navy-900" : "border-navy-600 text-ink-muted hover:border-ink-faint hover:text-ink"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {r.emoji}
              </span>
              {r.label}
            </button>
          );
        })}
      </div>
      {chosen && chosen !== "spot-on" && !sent && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-ink-muted" htmlFor={`miss-${attempt.id}`}>
            What did Coach miss? (optional - it helps him get better)
          </label>
          <div className="flex gap-2">
            <input
              id={`miss-${attempt.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              placeholder="e.g. he didn't notice my gestures"
              className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!note.trim()}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
      {chosen && (sent || chosen === "spot-on") && <p className="text-xs text-mindset">Thank you - that helps Coach get better.</p>}
      <p className="text-[0.7rem] leading-snug text-ink-faint">{CONSENT_LINE}</p>
    </section>
  );
}
