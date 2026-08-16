"use client";

import { useState } from "react";
import { badgeDefs } from "@/data/badges";
import type { AppState } from "@/lib/store";
import { BadgeMedal } from "@/components/badge-medal";
import { SectionBanner } from "@/components/section-banner";
import { TrophyIcon } from "@/components/icons";

// Every badge in the game, not only the ones already won. Seeing the
// locked ones is the point: an empty slot with a name on it is an
// invitation, where a hidden one is nothing at all.
//
// The tooltip answers to hover on desktop and to a tap on touch - a
// thumb has no hover, so the tap toggles it and a second tap (or a tap
// on another badge) puts it away.

export function BadgeCollection({ state }: { state: AppState }) {
  const earned = new Map(state.badges.map((b) => [b.id, b]));
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner
        // Versioned filename: the image optimiser caches by URL, so a
        // replaced file under the same name keeps serving the old one.
        // An alternate crowned-lion treatment sits at trophies-lion.jpg.
        image="/sections/trophies-v2.jpg"
        title="Trophy case"
        Icon={TrophyIcon}
        accentClass="text-storytelling"
        large
        right={
          <span className="text-xs tabular-nums text-ink-faint">
            {earned.size} of {badgeDefs.length} collected
          </span>
        }
      />
      <div className="flex flex-col gap-4 p-5">
      <div className="h-1.5 overflow-hidden rounded-full bg-navy-900">
        <div
          className="spectrum-rule h-full rounded-full transition-[width] duration-700"
          style={{ width: `${(earned.size / badgeDefs.length) * 100}%` }}
        />
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {badgeDefs.map((badge) => {
          const won = earned.get(badge.id);
          return (
            <li
              key={badge.id}
              // The group/tooltip pair below shows what a locked badge
              // wants from you - a collection you can't read is just a
              // wall of gray. A few keep their secret on purpose.
              onClick={() =>
                setOpenId((cur) => (cur === badge.id ? null : badge.id))
              }
              className={`group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${
                won
                  ? "border-navy-500 bg-navy-700"
                  : "border-dashed border-navy-600 bg-navy-900/40 hover:border-ink-faint"
              }`}
            >
              <span
                className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-lg border border-navy-500 bg-navy-950 p-2.5 text-left text-[0.7rem] leading-snug text-ink-muted shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
                  openId === badge.id ? "opacity-100" : "opacity-0"
                }`}
              >
                <b className="block pb-0.5 text-ink">{badge.title}</b>
                {won
                  ? badge.message
                  : (badge.how ?? "Hidden achievement - you'll know it when you get it.")}
              </span>
              <BadgeMedal
                id={badge.id}
                icon={badge.icon}
                earned={!!won}
                className="size-14"
              />
              <span
                className={`text-[0.65rem] font-semibold leading-tight ${
                  won ? "text-ink" : "text-ink-faint"
                }`}
              >
                {badge.title}
              </span>
              {won && (
                <span className="text-[0.6rem] tabular-nums text-ink-faint">
                  {new Date(won.earnedAt).toLocaleDateString()}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
