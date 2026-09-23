"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { SectionBanner } from "@/components/section-banner";
import { ChevronDownIcon, FilmIcon } from "@/components/icons";
import { Feedback } from "@/components/practice-panel";

// Everything the coach has said, newest first: each review's verdict,
// score, spectrum and what the coach said aloud, with the notes behind
// it a tap away. The record the coach answers questions from, laid
// out for the student to read themselves.

export function CoachHistory() {
  const { state, ready } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  // The whole shelf is folded by default: on the coach's own page the
  // lion is the thing to see, and a list of every review he has ever
  // written under him made the page a scroll.
  const [shelfOpen, setShelfOpen] = useState(false);
  if (!ready) return null;
  const attempts = [...state.attempts].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <button
        type="button"
        onClick={() => setShelfOpen((o) => !o)}
        aria-expanded={shelfOpen}
        className="w-full text-left transition-colors hover:bg-navy-700/40"
      >
        <SectionBanner
          title="Coach's reviews"
          Icon={FilmIcon}
          accentClass="text-structure"
          right={
            <span className="flex items-center gap-2 text-xs tabular-nums text-ink-faint">
              {attempts.length} {attempts.length === 1 ? "review" : "reviews"}
              <ChevronDownIcon className={`size-4 transition-transform ${shelfOpen ? "rotate-180" : ""}`} />
            </span>
          }
        />
      </button>
      <div className={`${shelfOpen ? "flex" : "hidden"} flex-col gap-3 p-5`}>
        {attempts.length === 0 && (
          <p className="text-sm text-ink-muted">
            Nothing yet - record a challenge and Coach&apos;s review lands here, to read back any time.
          </p>
        )}
        {attempts.map((a) => {
          const challenge = challenges.find((c) => c.slug === a.challengeSlug);
          const isOpen = open === a.id;
          return (
            <article key={a.id} className="overflow-hidden rounded-xl border border-navy-600 bg-navy-900/50">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : a.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-ink">{challenge?.title ?? a.challengeSlug}</span>
                  <span className="text-xs text-ink-faint">
                    {new Date(a.at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                    <span className={a.passed ? "text-mindset" : "text-storytelling"}>
                      {a.passed ? "passed" : "didn't pass"}
                    </span>
                  </span>
                </span>
                <span className="text-lg font-bold tabular-nums text-ink">
                  {a.score}
                  <span className="text-xs font-medium text-ink-faint"> / 100</span>
                </span>
                <ChevronDownIcon
                  className={`size-4 shrink-0 text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {/* Opening a review opens the review - the whole page,
                  here: the spectrum, what worked, the lessons, what to
                  do next. A folded summary meant reading it twice. */}
              {isOpen && challenge && (
                <div className="border-t border-navy-600 px-2 py-3 sm:px-3">
                  <Feedback attempt={a} videoUrl="" challenge={challenge} onDone={() => {}} revisit />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
