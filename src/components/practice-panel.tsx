"use client";

import { useStore } from "@/lib/store";
import type { Challenge } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";

// The practice loop panel — record, upload, review (build plan Phase 4).
// For the passive Mindset Toolbox challenge, completion is watching the
// lessons rather than uploading.

export function PracticePanel({ challenge }: { challenge: Challenge }) {
  const { state, ready } = useStore();

  if (!ready) return null;

  if (challenge.passive) {
    const watched = challenge.relatedLessonIds.filter((id) =>
      state.watchedLessons.includes(id),
    );
    const done = watched.length === challenge.relatedLessonIds.length;
    return (
      <section className="rounded-xl border border-navy-600 bg-navy-800 p-4">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-ink-faint">
          Your progress
        </h2>
        <p className="text-sm text-ink-muted">
          {done
            ? "Toolbox complete — every mindset lesson watched. That foundation carries the whole journey."
            : `${watched.length} of ${challenge.relatedLessonIds.length} lessons watched. Open each lesson above to complete this challenge.`}
        </p>
        {!done && (
          <ul className="mt-3 flex flex-col gap-1 text-xs text-ink-faint">
            {challenge.relatedLessonIds.map((id) => {
              const lesson = lessonByVimeoId.get(id);
              const isWatched = state.watchedLessons.includes(id);
              return (
                <li key={id} className="flex items-center gap-2">
                  <span className={isWatched ? "text-mindset" : "text-ink-faint"}>
                    {isWatched ? "✓" : "○"}
                  </span>
                  {lesson?.title ?? id}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-dashed border-navy-600 p-4 text-sm text-ink-faint">
      Recording and AI review arrive in the next phase of the build.
    </section>
  );
}
