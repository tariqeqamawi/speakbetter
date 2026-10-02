"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { colourOpen, FIRST_COLOUR, frontier, lessonOpen, openCount } from "@/lib/skills-lock";
import { useTourRunning } from "@/lib/tour-running";

/**
 * Keeps a student to the colours they have opened (skills-lock.ts),
 * sending them to the colour they're working on, every lesson listed.
 *
 * - No category or lesson (Skills itself): only while Presence is the one
 *   colour open - then Skills *is* Presence. Later, Skills shows the grid
 *   with its locks.
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
  if (ready && !touring) {
    const home = `${prefix}/skills/${frontier(state) ?? FIRST_COLOUR}?all=1`;
    if (lesson) {
      if (!lessonOpen(state, lesson, from)) to = home;
    } else if (category) {
      if (!colourOpen(state, category)) to = home;
    } else if (openCount(state) === 1) {
      to = home;
    }
  }

  useEffect(() => {
    if (to) router.replace(to);
  }, [to, router]);
  return { blocked: !ready || to !== null };
}

/** The gate on its own, for a server page. */
export function SkillsGate(props: { category?: string; lesson?: string }) {
  useSkillsGate(props);
  return null;
}
