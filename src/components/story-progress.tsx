"use client";

import { useStore } from "@/lib/store";
import { challenges, storyPhases } from "@/data/challenges";

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

export function StoryProgress() {
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
          return (
            <div key={phase.id} className="flex flex-1 flex-col gap-1">
              {/* An untouched phase is its own colour, just faded — the
                  journey is coloured from the start, and completing it
                  brings each phase up to full strength rather than
                  colouring in something grey. */}
              <div
                className={`h-2 overflow-hidden rounded-full ${phase.tintClass}`}
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
                className="text-center text-[0.65rem] font-bold text-ink"
                title={phase.name}
              >
                {phase.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
