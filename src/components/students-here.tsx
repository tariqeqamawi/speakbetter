"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { challengeBySlug, challenges, storyPhases } from "@/data/challenges";
import { ago, presence } from "@/data/community-presence";
import { CheckIcon, GroupIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// Who else is on the road (master plan §12).
//
// A button with a crowd on it, beside the journey. Tap it and the
// map's other walkers appear: how many students are on the challenge
// you're on, who uploaded an attempt at it in the last few hours, and
// where everyone else is along the road. None of it is about you; all
// of it is the reason to keep going. A road you can see other people
// on is a road worth walking, and a challenge that six people finished
// this afternoon is a challenge you can finish tonight.

export function StudentsHere({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { isChallengeComplete, ready } = useStore();
  const crowd = useMemo(() => presence(), []);
  const total = crowd.reduce((n, c) => n + c.count, 0);

  // The challenge you're on: the first one you haven't passed.
  const mine =
    challenges.find((c) => !c.passive && !isChallengeComplete(c.slug)) ??
    challenges.filter((c) => !c.passive).at(-1)!;
  const here = crowd.find((c) => c.slug === mine.slug);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!ready) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          hapticTap();
          setOpen(true);
        }}
        aria-label={`Other students on the road - ${here?.count ?? 0} on your challenge`}
        title="Who else is on the road"
        className={`flex items-center gap-1.5 rounded-full border border-navy-600 bg-navy-800 py-1 pl-1.5 pr-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-ink-faint hover:text-ink ${className}`}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-navy-700 text-ink">
          <GroupIcon className="size-4" />
        </span>
        <span className="tabular-nums">{here?.count ?? 0}</span>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-mindset opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-mindset" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Other students on the road"
            className="panel-in relative flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-navy-600 bg-navy-900 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-navy-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <GroupIcon className="size-5 text-ink-muted" />
                <h2 className="text-sm font-semibold text-ink">On the road with you</h2>
              </div>
              <span className="text-xs tabular-nums text-ink-faint">
                {total} students today
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-navy-800 hover:text-ink"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
              {/* Your challenge: the count, and the recent uploads. */}
              <section className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Your challenge
                </p>
                <div className="rounded-xl border border-navy-600 bg-navy-800 p-3">
                  <p className="text-sm font-semibold text-ink">{mine.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    <span className="font-bold tabular-nums text-mindset">
                      {here?.count ?? 0}
                    </span>{" "}
                    other {here?.count === 1 ? "student is" : "students are"} on it right now
                  </p>
                  {here && here.recent.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {here.recent.map((s) => (
                        <li key={s.name} className="flex items-center gap-2.5 text-sm">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-700 text-[0.7rem] font-bold text-ink">
                            {s.name[0]}
                          </span>
                          <span className="flex-1 text-ink">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-ink-muted"> uploaded an attempt</span>
                          </span>
                          {s.passed && <CheckIcon className="size-3.5 text-mindset" />}
                          <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                            {ago(s.uploadedMinutesAgo ?? 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/challenges/${mine.slug}`}
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-block text-xs font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    Go to your challenge →
                  </Link>
                </div>
              </section>

              {/* Everyone else, along the road. */}
              <section className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Where everyone is
                </p>
                <ul className="flex flex-col gap-1">
                  {crowd.map((c) => {
                    const challenge = challengeBySlug.get(c.slug)!;
                    const phase = storyPhases.find((p) => p.id === challenge.phase)!;
                    const isMine = c.slug === mine.slug;
                    const max = Math.max(...crowd.map((x) => x.count));
                    return (
                      <li key={c.slug}>
                        <Link
                          href={`/challenges/${c.slug}`}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-navy-800 ${
                            isMine ? "bg-navy-800" : ""
                          }`}
                        >
                          <span
                            className={`w-4 shrink-0 text-center text-[0.65rem] font-bold ${phase.textClass}`}
                          >
                            {phase.id}
                          </span>
                          <span
                            className={`min-w-0 flex-1 truncate text-xs ${
                              isMine ? "font-semibold text-ink" : "text-ink-muted"
                            }`}
                          >
                            {challenge.title}
                          </span>
                          <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-navy-700">
                            <span
                              className={`block h-full rounded-full ${isMine ? "bg-mindset" : "bg-navy-600"}`}
                              style={{ width: `${(100 * c.count) / max}%` }}
                            />
                          </span>
                          <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-faint">
                            {c.count}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <p className="text-center text-[0.7rem] text-ink-faint text-balance">
                First names only, and only that an attempt was uploaded - never
                the video, never the score.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
