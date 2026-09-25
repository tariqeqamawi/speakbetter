"use client";

import { useMemo, useState } from "react";
import { badgeDefs } from "@/data/badges";
import { TrophyRoom } from "@/components/trophy-room";
import { caseTrophies } from "@/lib/trophy-case";

// The real trophy case (components/trophy-room.tsx) with a pretend
// record behind it, so the room can be looked at without winning
// anything. All won is the collection; part-way is what a student
// actually sees in week three, with the silhouettes in the case.

const WHEN = "2026-10-10T12:00:00.000Z";

export function SpotlightPreview() {
  const [partWay, setPartWay] = useState(false);
  const trophies = useMemo(
    () => caseTrophies(badgeDefs.filter((_, i) => !partWay || i % 3 !== 1).map((b) => ({ id: b.id, earnedAt: WHEN }))),
    [partWay],
  );

  return (
    <TrophyRoom
      trophies={trophies}
      studentName="Sample Student"
      rarity={false}
      toolbar={
        <div className="flex justify-center">
          <div role="radiogroup" aria-label="Show as" className="flex rounded-full border border-navy-700 bg-navy-900/70 p-1 text-sm">
            {[
              { v: false, label: "All won" },
              { v: true, label: "Part-way through" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={partWay === o.v}
                onClick={() => setPartWay(o.v)}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  partWay === o.v ? "bg-navy-600 text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
