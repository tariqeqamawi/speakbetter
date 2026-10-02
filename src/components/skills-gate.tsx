"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { colourOpen, FIRST_COLOUR, skillsOpen } from "@/lib/skills-lock";
import { useTourRunning } from "@/lib/tour-running";

/** Sends a student who hasn't opened the other colours yet to Presence,
 *  with every Presence lesson listed (skills-lock.ts). With a category,
 *  only that colour is checked; without, the whole of Skills. Renders
 *  nothing; `blocked` tells the caller to hold its own content back (also while
 *  the record is still loading, so a locked page never flashes). */
export function useSkillsGate(category?: string): { blocked: boolean } {
  const { state, ready } = useStore();
  const router = useRouter();
  const touring = useTourRunning();
  const prefix = usePathname().startsWith("/demo") ? "/demo" : "";
  const open = category ? colourOpen(state, category) : skillsOpen(state);
  const blocked = ready && !open && !touring;
  useEffect(() => {
    if (blocked) router.replace(`${prefix}/skills/${FIRST_COLOUR}?all=1`);
  }, [blocked, router, prefix]);
  return { blocked: blocked || !ready };
}

export function SkillsGate({ category }: { category: string }) {
  useSkillsGate(category);
  return null;
}
