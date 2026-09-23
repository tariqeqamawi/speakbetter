"use client";

import { useStore } from "@/lib/store";
import { challenges, storyPhases, type PhaseId } from "@/data/challenges";
import { useChallengeComplete } from "@/components/story-progress";
import { phaseGate } from "@/lib/progress";
import { CheckIcon, LockIcon } from "@/components/icons";

// STORY, across the top: five circles, one per phase, in the road's own
// colours. The phase the student is on pulses; the one they're looking
// at is ringed. Tapping a circle shows that stretch of the road below -
// including the ones still locked, because a student should be able to
// see where they're going before they can go there.
//
// This replaces the progress bar that used to sit here, and the long
// scroll through every phase at once: one letter, one stretch of road.

export function PhasePicker({
  open,
  onOpen,
}: {
  open: PhaseId;
  onOpen: (id: PhaseId) => void;
}) {
  const { state, ready } = useStore();
  const isComplete = useChallengeComplete();
  if (!ready) return null;

  const done = challenges.filter((c) => isComplete(c.slug)).length;
  // The phase they're actually on: the first with anything left in it.
  const currentIndex = storyPhases.findIndex((p) =>
    challenges.some((c) => c.phase === p.id && !isComplete(c.slug)),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs text-ink-faint">
        <span>Your STORY journey</span>
        <span className="tabular-nums">
          {done} / {challenges.length} challenges
        </span>
      </div>
      <ol className="flex items-start gap-1">
        {storyPhases.map((phase, i) => {
          const inPhase = challenges.filter((c) => c.phase === phase.id);
          const doneInPhase = inPhase.filter((c) => isComplete(c.slug)).length;
          const complete = doneInPhase === inPhase.length;
          const gate = phaseGate(state, i);
          const selected = open === phase.id;
          const here = i === currentIndex;
          return (
            <li key={phase.id} className="flex flex-1 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => onOpen(phase.id)}
                aria-pressed={selected}
                title={`${phase.name} - ${doneInPhase} of ${inPhase.length} passed${gate.open ? "" : gate.rank ? `, opens at ${gate.rank.name}` : ", locked"}`}
                className={`relative grid size-11 place-items-center rounded-full text-sm font-bold transition-transform sm:size-12 ${
                  complete
                    ? `${phase.bgClass} text-navy-950 ${phase.textClass} shadow-[0_0_16px_-2px_currentColor]`
                    : gate.open
                      ? `border-2 border-current bg-navy-900 ${phase.textClass} ${here ? "map-pulse" : ""}`
                      : "border border-navy-600 bg-navy-900 text-ink-faint"
                } ${selected ? "scale-110 ring-2 ring-ink/70 ring-offset-2 ring-offset-navy-900" : "hover:scale-105"}`}
              >
                {complete ? <CheckIcon className="size-4" /> : phase.id}
                {!gate.open && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-navy-700 bg-navy-950 text-ink-faint">
                    <LockIcon className="size-2.5" />
                  </span>
                )}
              </button>
              {/* How far through this phase is, under its letter. */}
              <span className={`h-1 w-full overflow-hidden rounded-full ${phase.tintClass}`}>
                <span
                  className={`block h-full rounded-full ${phase.bgClass} ${doneInPhase > 0 ? `${phase.textClass} shadow-[0_0_8px_currentColor]` : ""}`}
                  style={{ width: `${(doneInPhase / inPhase.length) * 100}%` }}
                />
              </span>
              <span className={`text-center text-[0.6rem] leading-tight ${selected ? phase.textClass : "text-ink-faint"}`}>
                {doneInPhase}/{inPhase.length}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
