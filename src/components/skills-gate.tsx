"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { colourOpen, FIRST_COLOUR, frontier, lessonOpen, openCount } from "@/lib/skills-lock";
import { useTourRunning } from "@/lib/tour-running";
import { showLocked } from "@/lib/lock-notice";
import { lessonByVimeoId } from "@/data/lessons";
import type { CategoryId } from "@/data/categories";

/**
 * Keeps a student to the colours they have opened (skills-lock.ts),
 * sending them to the colour they're working on, every lesson listed.
 *
 * - No category or lesson (Skills itself): only on a brand-new student's
 *   first visit - then Skills *is* Presence. After that, Skills shows the
 *   dial or the grid with its locks.
 *
 * Sent away from a locked colour or lesson, the student gets the notice
 * saying what to watch to open it (lock-notice.tsx).
 * - A category: that colour must be open.
 * - A lesson: that lesson must be open - its colour, or a challenge it
 *   was opened from (?from=<slug>) that asks for it.
 *
 * `blocked` tells the caller to hold its own content back (also while the
 * record is still loading, so a locked page never flashes). The tour
 * walks through everything, so the gate stands aside while it runs.
 */
export function useSkillsGate({ category, lesson }: { category?: string; lesson?: string } = {}): { blocked: boolean } {
  const { state, ready } = useStore();
  const router = useRouter();
  const touring = useTourRunning();
  const params = useSearchParams();
  const prefix = usePathname().startsWith("/demo") ? "/demo" : "";
  const from = params.get("from");

  let to: string | null = null;
  // The colour that was locked, for the notice that says how to open it.
  let lockedColour: CategoryId | null = null;
  if (ready && !touring) {
    const home = `${prefix}/skills/${frontier(state) ?? FIRST_COLOUR}?all=1`;
    if (lesson) {
      if (!lessonOpen(state, lesson, from)) {
        to = home;
        lockedColour = lessonByVimeoId.get(lesson)?.category ?? null;
      }
    } else if (category) {
      if (!colourOpen(state, category)) {
        to = home;
        lockedColour = category as CategoryId;
      }
    } else if (openCount(state) === 1 && state.watchedLessons.length === 0) {
      // A brand-new student's first visit: Skills opens on Presence.
      // Once they've watched one, Skills shows the dial or grid with its
      // locks, so the way back from Presence isn't a loop.
      to = home;
    }
  }

  useEffect(() => {
    if (!to) return;
    if (lockedColour) showLocked(lockedColour);
    router.replace(to);
  }, [to, lockedColour, router]);
  return { blocked: !ready || to !== null };
}

/** The gate on its own, for a server page. */
export function SkillsGate(props: { category?: string; lesson?: string }) {
  useSkillsGate(props);
  return null;
}
