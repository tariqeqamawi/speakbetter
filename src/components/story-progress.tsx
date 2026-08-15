"use client";

import { useStore } from "@/lib/store";
import { challenges, storyPhases, type PhaseId } from "@/data/challenges";

// The STORY progress bar (master plan §11): a student should always be
// able to see, at a glance, how far through the journey they've come.

export function useChallengeComplete() {
  const { state, isChallengeComplete } = useStore();
  return (slug: string) => {
    const challenge = challenges.find((c) => c.slug === slug);
    if (!challenge) return false;
    if (challenge.passive) {
      return challenge.relatedLessonIds.every((id) =>
        state.watchedLessons.includes(id),
      );
    }
    return isChallengeComplete(slug);
  };
}

export function StoryProgress({
  open,
  onOpen,
}: {
  /** When given, each bar becomes a control that opens its phase below. */
  open?: PhaseId;
  onOpen?: (id: PhaseId) => void;
} = {}) {
  const { ready } = useStore();
  const isComplete = useChallengeComplete();
  if (!ready) return null;

  const done = challenges.filter((c) => isComplete(c.slug)).length;
  const total = challenges.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs text-ink-faint">
        <span>Your STORY journey</span>
        <span className="tabular-nums">
          {done} / {total} challenges
        </span>
      </div>
      <div className="flex gap-1">
        {storyPhases.map((phase) => {
          const inPhase = challenges.filter((c) => c.phase === phase.id);
          const doneInPhase = inPhase.filter((c) => isComplete(c.slug)).length;
          const started = doneInPhase > 0;
          const selected = open === phase.id;
          const Tag = onOpen ? "button" : "div";
          return (
            <Tag
              key={phase.id}
              {...(onOpen
                ? {
                    type: "button" as const,
                    onClick: () => onOpen(phase.id),
                    "aria-pressed": selected,
                    title: `${phase.name} — ${doneInPhase} of ${inPhase.length} complete`,
                  }
                : {})}
              className={`group flex flex-1 flex-col gap-1 rounded-lg transition-transform ${
                onOpen ? "cursor-pointer hover:-translate-y-0.5" : ""
              } ${selected ? "-translate-y-0.5" : ""}`}
            >
              {/* An untouched phase is its own color, just faded — the
                  journey is colored from the start, and completing it
                  brings each phase up to full strength rather than
                  coloring in something gray. */}
              <div
                className={`overflow-hidden rounded-full transition-all ${phase.tintClass} ${
                  selected ? "h-3" : "h-2 group-hover:h-2.5"
                }`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${phase.bgClass} ${phase.textClass} ${
                    // The glow is what reads as "vivid"; on an empty bar it
                    // would sit there as a bright dot, so it waits for
                    // the first completed challenge.
                    started ? "shadow-[0_0_10px_currentColor]" : ""
                  }`}
                  style={{ width: `${(doneInPhase / inPhase.length) * 100}%` }}
                />
              </div>
              <span
                className={`text-center text-[0.65rem] font-bold transition-colors ${
                  selected ? phase.textClass : "text-ink"
                }`}
              >
                {phase.id}
              </span>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
