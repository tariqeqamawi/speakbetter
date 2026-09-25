"use client";

import { useMemo } from "react";
import type { AppState } from "@/lib/store";
import { SectionBanner } from "@/components/section-banner";
import { TrophyIcon } from "@/components/icons";
import { TrophyRoom } from "@/components/trophy-room";
import { caseTrophies } from "@/lib/trophy-case";

// The trophy case: the student's own trophies, in the trophy room.
//
// It was a drawn medallion turning on a CSS plinth, with a shelf of
// small circles underneath. The trophies are rendered objects now - a
// figure on a post on a plinth, in a material that says how hard it was
// to win - and a case that shows them as circles hides everything that
// makes them worth winning. So the case IS the room from
// /prototype/spotlight: the stage with the smoke in the beam, the one
// in the light, the rest by material underneath - fed by what this
// student has actually won.

export function BadgeCollection({ state }: { state: AppState }) {
  const trophies = useMemo(() => caseTrophies(state.badges), [state.badges]);
  // It opens on the newest trophy won - the one they came to look at -
  // or, before the first, on the first they could win.
  const newest = [...state.badges].sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1))[0];
  const at = Math.max(
    0,
    trophies.findIndex((t) => (newest ? t.id === newest.id : t.id === "first-upload")),
  );

  return (
    <div id="trophy-case" className="flex scroll-mt-20 flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner title="Trophy case" Icon={TrophyIcon} accentClass="text-storytelling" large />
      <div className="p-4 sm:p-5">
        <TrophyRoom trophies={trophies} initialAt={at} studentName={state.displayName} />
      </div>
    </div>
  );
}
