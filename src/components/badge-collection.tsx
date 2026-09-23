"use client";

import { useEffect, useState } from "react";
import { badgeDefs } from "@/data/badges";
import type { AppState } from "@/lib/store";
import { BadgeMedal } from "@/components/badge-medal";
import { SectionBanner } from "@/components/section-banner";
import { TrophyIcon, XIcon } from "@/components/icons";

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
  const open = openId ? badgeDefs.find((b) => b.id === openId) : undefined;

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
              onClick={() => setOpenId(badge.id)}
              className={`group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${
                won
                  ? "border-navy-500 bg-navy-700"
                  : "border-dashed border-navy-600 bg-navy-900/40 hover:border-ink-faint"
              }`}
            >
              <span
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-44 -translate-x-1/2 rounded-lg border border-navy-500 bg-navy-950 p-2.5 text-left text-[0.7rem] leading-snug text-ink-muted opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:block"
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
      {open && (
        <TrophyDetail
          badge={open}
          won={earned.get(open.id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

/**
 * One trophy, up close: the medal large and turning, the day it was
 * won, and what won it - or, for one not yet won, what would. The
 * medal is the same artwork as the case and the celebration toast; the
 * turn is a CSS rotation, so nothing new is loaded to look closer.
 */
function TrophyDetail({
  badge,
  won,
  onClose,
}: {
  badge: (typeof badgeDefs)[number];
  won: { earnedAt: string } | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trophy-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="celebration-pop relative flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-navy-600 bg-navy-800 px-6 pb-7 pt-10 text-center shadow-2xl shadow-navy-950/80"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-navy-600 text-ink-muted transition-colors hover:text-ink"
        >
          <XIcon className="size-4" />
        </button>
        <span className="spectrum-rule h-1 w-16 rounded-full" />
        {/* A coin: the trophy on one face, the mark on the other. It
            holds on the trophy, turns to show the lion, holds, and
            turns back. */}
        <span className={`trophy-stage ${won ? "" : "opacity-60"}`} aria-hidden>
          <span className="trophy-coin">
            <span className="trophy-face">
              <BadgeMedal id={badge.id} icon={badge.icon} earned={!!won} className="size-44 sm:size-52" />
              {won && <span className="trophy-shine" />}
            </span>
            <span className="trophy-face trophy-face-back">
              <span className="grid size-44 place-items-center rounded-full border border-navy-600 bg-navy-950 sm:size-52">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.png" alt="" className={`w-2/3 ${won ? "" : "opacity-40 grayscale"}`} />
              </span>
            </span>
          </span>
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
            {won ? "Trophy earned" : "Not yet earned"}
          </span>
          <h3 id="trophy-title" className="text-xl font-bold text-ink">
            {badge.title}
          </h3>
          {won && (
            <span className="text-xs tabular-nums text-ink-faint">
              {new Date(won.earnedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </span>
        <p className="text-sm text-ink-muted text-balance">
          {won ? badge.message : (badge.how ?? "Hidden achievement - you'll know it when you get it.")}
        </p>
        {won && badge.how && (
          <p className="neon-edge rounded-xl bg-navy-900 px-4 py-3 text-xs text-ink-muted text-balance">
            <b className="block pb-0.5 font-semibold text-ink">How you unlocked it</b>
            {badge.how}
          </p>
        )}
      </div>
    </div>
  );
}
