"use client";

import { useMemo } from "react";
import { challenges } from "@/data/challenges";
import { challengeChatter } from "@/data/challenge-chatter";
import { presence } from "@/data/community-presence";
import { challengeProgress } from "@/lib/challenge-progress";
import { openPhaseCount } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { AdventureView } from "./adventure-view";
import { worldPhases } from "./world-phases";
import type { WorldStop } from "./adventure-world";

// The S.T.O.R.Y. road on the Challenges page, from the student's own
// record: what they have passed and their best score on it, the one they
// are on, the trophies they have won, and their photo on the traveller.
//
// The rules of the road: sections open as the student's rank opens them
// (the same gates as ever - openPhaseCount), and every challenge in an
// open section can be taken, in whatever order they like. The road opens
// at the first one not yet passed.

export function LiveAdventure() {
  const { state, ready } = useStore();
  const crowd = useMemo(() => presence(), []);

  const stops = useMemo<WorldStop[]>(() => {
    const open = ready ? Math.max(1, openPhaseCount(state)) : 1;
    const phaseIndex = new Map(worldPhases.map((p, i) => [p.id, i]));
    const passedOf = (c: (typeof challenges)[number]) => ready && challengeProgress(c, state).passed;
    const inOpen = (c: (typeof challenges)[number]) => (phaseIndex.get(c.phase) ?? 0) < open;
    return challenges.map((c) => {
      const st: WorldStop["state"] = passedOf(c) ? "done" : inOpen(c) ? "here" : "locked";
      const best = state.attempts
        .filter((a) => a.challengeSlug === c.slug && a.passed)
        .reduce<number | undefined>((m, a) => Math.max(m ?? 0, a.score ?? 0), undefined);
      const here = crowd.find((p) => p.slug === c.slug);
      const chatter = challengeChatter[c.slug]?.[0];
      return {
        slug: c.slug,
        title: c.title,
        phase: c.phase,
        state: st,
        image: c.vimeoId ? `/thumbs/${c.vimeoId}.jpg` : "/lion-head.png",
        trophy: `/trophy/challenge-${c.slug}.webp`,
        trophyWon: state.badges.some((b) => b.id === `challenge-${c.slug}`),
        score: best,
        // Other students on it now - the same sample crowd the dashboard
        // shows, until the cohort is read from the database.
        classmates: here?.recent.slice(0, 3).map((s) => ({ name: s.name })),
        comment: chatter && { name: chatter.name, body: chatter.body },
      };
    });
  }, [state, ready, crowd]);

  return (
    <div data-tour="journey">
      {/* Keyed on readiness so the road opens where the student really is,
          not at the start while their record is still loading. */}
      {/* Exactly the screen between the header and the page's floor (the
          tab bar's room on a phone), once scrolled to the end. */}
      <AdventureView
        key={ready ? "ready" : "loading"}
        stops={stops}
        phases={worldPhases}
        heightClass="h-[calc(100dvh-11rem)] sm:h-[calc(100dvh-7rem)]"
      />
    </div>
  );
}
