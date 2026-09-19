"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { SectionBanner } from "@/components/section-banner";
import { ChevronDownIcon, FilmIcon } from "@/components/icons";
import { SpectrumKey } from "@/components/spectrum";

// Everything the coach has said, newest first: each review's verdict,
// score, spectrum and what the coach said aloud, with the notes behind
// it a tap away. The record the coach answers questions from, laid
// out for the student to read themselves.

export function CoachHistory() {
  const { state, ready } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  if (!ready) return null;
  const attempts = [...state.attempts].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner
        image="/sections/challenges.jpg"
        title="What your coach has said"
        Icon={FilmIcon}
        accentClass="text-structure"
        right={
          <span className="text-xs tabular-nums text-ink-faint">
            {attempts.length} {attempts.length === 1 ? "review" : "reviews"}
          </span>
        }
      />
      <div className="flex flex-col gap-3 p-5">
        {attempts.length === 0 && (
          <p className="text-sm text-ink-muted">
            Nothing yet - record a challenge and your coach&apos;s review lands here, to read back any time.
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
              {isOpen && (
                <div className="flex flex-col gap-4 border-t border-navy-600 px-4 py-4">
                  <SpectrumKey spectrum={a.spectrum} required={challenge?.targetSkills} />
                  {a.spoken ? (
                    <p className="text-sm leading-relaxed text-ink">{a.spoken}</p>
                  ) : (
                    a.summary && <p className="text-sm leading-relaxed text-ink">{a.summary}</p>
                  )}
                  {a.focus.length > 0 && (
                    <ul className="flex flex-col gap-1.5">
                      {a.focus.map((n, i) => (
                        <li key={i} className="text-xs text-ink-muted">
                          <span className="font-semibold text-ink-faint">Next time: </span>
                          {n.note}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/challenges/${a.challengeSlug}`}
                    className="self-start text-xs font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    Go to this challenge →
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
