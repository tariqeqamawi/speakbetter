"use client";

import Link from "next/link";
import { useState } from "react";
import { challenges, storyPhases } from "@/data/challenges";
import type { AppState } from "@/lib/store";
import { challengeXp, challengeXpFor, openPhaseCount, phaseGate } from "@/lib/progress";
import { CheckIcon, LockIcon } from "@/components/icons";

// The journey, on the dashboard: five circles that always say S, T, O,
// R, Y - a locked one is dimmed and wears a lock, but it never hides
// its letter, because the word is the map and a row of padlocks spells
// nothing.
//
// Tapping a circle opens that phase, and the space under it is spent on
// the challenges themselves - each with the line that says what it
// asks for - rather than on a row of thumbnails too small to read. A
// student on S has three challenges; three named things to do is worth
// more than three gray squares.
//
// What a student may see is deliberately one phase further than what
// they may do: the phases that are open, and the next one after them,
// list their challenges in full. Beyond that the road is veiled - not
// as a tease, but because a list of twenty-four briefs at the start is
// a syllabus, and the journey is meant to unfold.

/** A word for each phase that fits under a circle. */
const SHORT: Record<string, string> = {
  S: "Awareness",
  T: "Instrument",
  O: "Stories",
  R: "Truth",
  Y: "The world",
};

export function JourneyPhases({
  state,
  isComplete,
}: {
  state: AppState;
  isComplete: (slug: string) => boolean;
}) {
  const open = openPhaseCount(state);
  // Open on the phase the student is actually in: the first with
  // anything left in it, never further than the road reaches.
  const unfinished = storyPhases.findIndex((p) =>
    challenges.some((c) => c.phase === p.id && !isComplete(c.slug)),
  );
  const current =
    unfinished === -1 ? storyPhases.length - 1 : Math.min(unfinished, Math.max(0, open - 1));
  const [pick, setPick] = useState(current);

  const phase = storyPhases[pick];
  const gate = phaseGate(state, pick);
  const inPhase = challenges.filter((c) => c.phase === phase.id);
  const done = inPhase.filter((c) => isComplete(c.slug)).length;
  const paid = inPhase.reduce((sum, c) => {
    const best = state.attempts
      .filter((a) => a.challengeSlug === c.slug && a.passed)
      .sort((a, b) => b.score - a.score)[0];
    return sum + (best ? challengeXpFor(c, best.score) : c.passive && isComplete(c.slug) ? challengeXp(c) : 0);
  }, 0);
  const worth = inPhase.reduce((sum, c) => sum + challengeXp(c), 0);
  // The open phases, and one more - the next door is worth seeing through.
  const revealed = pick <= open;

  return (
    <div className="flex flex-col gap-4">
      {/* The road: five letters, lit as far as it has been walked. */}
      <div className="flex items-start">
        {storyPhases.map((p, i) => {
          const g = phaseGate(state, i);
          const list = challenges.filter((c) => c.phase === p.id);
          const full = list.every((c) => isComplete(c.slug));
          const on = i === pick;
          const last = i === storyPhases.length - 1;
          return (
            <div key={p.id} className={`flex flex-col items-start gap-1.5 ${last ? "flex-none" : "flex-1"}`}>
              <span className="flex w-full items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPick(i)}
                  aria-pressed={on}
                  title={`${p.name}${g.open ? "" : g.rank ? ` - opens at ${g.rank.name}` : ""}`}
                  className={`relative grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-transform hover:scale-105 ${
                    full
                      ? `${p.bgClass} text-navy-950 shadow-[0_0_14px_-2px_currentColor] ${p.textClass}`
                      : g.open
                        ? `border-2 border-current bg-navy-900 ${p.textClass}`
                        : `border border-current bg-navy-900 ${p.textClass} opacity-55`
                  } ${on ? "ring-2 ring-current ring-offset-2 ring-offset-navy-800" : ""}`}
                >
                  {p.id}
                  {full ? (
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-navy-950 text-ink">
                      <CheckIcon className="size-2.5" />
                    </span>
                  ) : (
                    !g.open && (
                      <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-navy-950 text-ink-faint">
                        <LockIcon className="size-2.5" />
                      </span>
                    )
                  )}
                </button>
                {!last && (
                  <span className={`h-0.5 flex-1 rounded-full ${full ? p.bgClass : "bg-navy-700"}`} />
                )}
              </span>
              <span
                className={`w-9 text-center text-[0.55rem] font-semibold uppercase leading-tight tracking-wide ${p.textClass} ${
                  on ? "" : g.open ? "opacity-80" : "opacity-50"
                }`}
              >
                {SHORT[p.id]}
              </span>
            </div>
          );
        })}
      </div>

      {/* The phase that's open, and what's in it. */}
      <div className="flex flex-col gap-3 rounded-xl border border-navy-600 bg-navy-900/50 p-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-bold ${gate.open ? phase.textClass : "text-ink-faint"}`}>
            {phase.id}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{phase.name}</span>
          <span className="shrink-0 text-[0.65rem] tabular-nums text-ink-faint">
            <b className={`font-semibold ${paid > 0 ? phase.textClass : ""}`}>{paid}</b>/{worth} XP
            <span className="pl-1.5">
              {done}/{inPhase.length} passed
            </span>
          </span>
        </div>

        {revealed ? (
          <ul className="flex flex-col gap-1.5">
            {inPhase.map((c) => {
              const passed = isComplete(c.slug);
              const body = (
                <>
                  <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-navy-950">
                    {c.vimeoId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/thumbs/${c.vimeoId}.jpg`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`size-full object-cover ${passed ? "" : "opacity-40 grayscale"}`}
                      />
                    ) : (
                      <span className={`block size-full ${phase.tintClass} ${passed ? "" : "opacity-40"}`} />
                    )}
                    {passed ? (
                      <span
                        className={`absolute bottom-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-navy-950/85 ${phase.textClass}`}
                      >
                        <CheckIcon className="size-2.5" />
                      </span>
                    ) : (
                      !gate.open && (
                        <span className="absolute bottom-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-navy-950/85 text-ink-faint">
                          <LockIcon className="size-2.5" />
                        </span>
                      )
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
                    <span className={`truncate text-sm font-semibold ${gate.open ? "text-ink" : "text-ink-muted"}`}>
                      {c.title}
                    </span>
                    <span className="line-clamp-2 text-xs leading-snug text-ink-faint">{c.brief}</span>
                  </span>
                </>
              );
              return (
                <li key={c.slug}>
                  {gate.open ? (
                    <Link
                      href={`/challenges/${c.slug}`}
                      className="flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-navy-800"
                    >
                      {body}
                    </Link>
                  ) : (
                    <span className="flex gap-3 rounded-lg p-1.5 opacity-70">{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-navy-600 px-4 py-7 text-center">
            <LockIcon className="size-5 text-ink-faint" />
            <p className="text-sm font-semibold text-ink-muted text-balance">
              Complete the previous challenges to reveal these ones
            </p>
            <p className="text-xs text-ink-faint">
              {inPhase.length} challenges waiting in {phase.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
