"use client";

import { useEffect, useState } from "react";
import { badgeDefs } from "@/data/badges";
import type { AppState } from "@/lib/store";
import { SectionBanner } from "@/components/section-banner";
import { TrophyStand, trophyColor } from "@/components/trophy-stand";
import { ChevronDownIcon, TrophyIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// The trophy case: one trophy at a time, on a lit plinth, turning
// slowly so the lion on the back of the medal comes round - and the
// whole collection underneath as a shelf you can walk. Won and locked
// stand on the same shelf, because an empty stand with a name on it is
// an invitation, where a hidden one is nothing at all.
//
// It was a grid of circles. A case with a spotlight in it makes the
// things in it feel worth having, which is the entire job of a trophy.

export function BadgeCollection({ state }: { state: AppState }) {
  const earned = new Map(state.badges.map((b) => [b.id, b]));
  const [filter, setFilter] = useState<"won" | "all">("all");
  const [shelfOpen, setShelfOpen] = useState(false);
  const shelf = filter === "won" ? badgeDefs.filter((b) => earned.has(b.id)) : badgeDefs;
  // The one on the plinth. Opens on the newest trophy won.
  const newest = [...state.badges].sort((a, b) => (a.earnedAt < b.earnedAt ? 1 : -1))[0];
  const [openId, setOpenId] = useState<string | null>(newest?.id ?? badgeDefs[0]?.id ?? null);
  const index = Math.max(0, shelf.findIndex((b) => b.id === openId));
  const shown = shelf[index] ?? shelf[0];
  const won = shown ? earned.get(shown.id) : undefined;

  const go = (delta: number) => {
    if (shelf.length === 0) return;
    hapticTap();
    setOpenId(shelf[(index + delta + shelf.length) % shelf.length].id);
  };

  // Arrows walk the shelf.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, shelf.length]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner
        title="Trophy case"
        Icon={TrophyIcon}
        accentClass="text-storytelling"
        large
        right={
          <span className="text-xs tabular-nums text-ink-faint">
            {earned.size} of {badgeDefs.length}
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

        {/* Won, or everything - the same shelf, filtered. */}
        <div className="flex w-full gap-1 rounded-xl border border-navy-600 bg-navy-900/60 p-1">
          {(["won", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
                filter === f ? "bg-navy-700 text-ink" : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              {f === "won" ? `Won (${earned.size})` : `All (${badgeDefs.length})`}
            </button>
          ))}
        </div>

        {shown ? (
          <>
            {/* The case: a spotlight, a plinth, and the trophy turning. */}
            <div className="trophy-case relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-navy-600 px-4 pb-5 pt-8">
              {/* The spotlight: a lamp at the top of the case and the
                  cone it throws, swinging slowly across the trophy so
                  the light feels live rather than painted on. The lion
                  watermark that used to tile the back is gone - a
                  pattern behind a display case is wallpaper, and it
                  fought the one thing the case is for. */}
              <span aria-hidden className="trophy-spot pointer-events-none absolute inset-x-0 top-0 h-72" />
              <span
                aria-hidden
                className="trophy-lamp pointer-events-none absolute left-1/2 top-0 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl"
                style={{ background: won ? `var(--color-${trophyColor(shown.id)})` : "rgba(231,233,242,0.55)" }}
              />

              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous trophy"
                className="absolute left-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-navy-600 bg-navy-950/70 text-ink-muted transition-colors hover:text-ink"
              >
                <ChevronDownIcon className="size-5 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next trophy"
                className="absolute right-2 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-navy-600 bg-navy-950/70 text-ink-muted transition-colors hover:text-ink"
              >
                <ChevronDownIcon className="size-5 -rotate-90" />
              </button>

              {/* The podium and its light don't move; the trophy
                  standing on them is what changes, arriving from the
                  side you came from. */}
              <div className="relative flex h-64 w-full items-end justify-center sm:h-72">
                <span key={shown.id} className="trophy-swap absolute bottom-10">
                  <TrophyStand id={shown.id} icon={shown.icon} won={!!won} size="lg" flip pedestal={false} />
                </span>

                {/* the pool of light on the podium's top */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-9 h-7 w-56 rounded-[50%] blur-md transition-colors duration-500"
                  style={{
                    background: won ? `var(--color-${trophyColor(shown.id)})` : "rgba(30,42,75,0.8)",
                    opacity: won ? 0.45 : 0.25,
                  }}
                />

                {/* the podium itself */}
                <span aria-hidden className="absolute bottom-0 flex flex-col items-center">
                  <span
                    className="h-3 w-44 rounded-[4px]"
                    style={{ background: "linear-gradient(180deg, #33406a, #1b2440)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
                  />
                  <span
                    className="h-8 w-36"
                    style={{ background: "linear-gradient(180deg, #1b2440, #0b1120)" }}
                  />
                  <span
                    className="h-2 w-48 rounded-[4px]"
                    style={{ background: "linear-gradient(180deg, #2a3559, #131b33)", boxShadow: "0 10px 26px -10px rgba(0,0,0,0.9)" }}
                  />
                </span>
              </div>

              <div className="relative flex flex-col items-center gap-1 text-center">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
                  {won ? "Won" : "Not yet won"} · {index + 1} of {shelf.length}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-ink">{shown.title}</h3>
                {won && (
                  <span className="text-xs tabular-nums text-ink-faint">
                    {new Date(won.earnedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                <p className="max-w-sm text-sm text-ink-muted text-balance">
                  {won ? shown.message : (shown.how ?? "Hidden achievement - you'll know it when you get it.")}
                </p>
                {won && shown.how && (
                  <p className="neon-edge mt-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs text-ink-muted text-balance">
                    <b className="block pb-0.5 font-semibold text-ink">How you unlocked it</b>
                    {shown.how}
                  </p>
                )}
              </div>
            </div>

            {/* The shelf, behind a door: the case is the thing to look
                at, and forty-seven trophies underneath it was a wall. */}
            <button
              type="button"
              onClick={() => setShelfOpen((o) => !o)}
              aria-expanded={shelfOpen}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-navy-600 bg-navy-900/60 px-4 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              <span>
                {filter === "won" ? "Every trophy you've won" : "Every trophy in the case"}
                <span className="pl-2 text-xs font-normal text-ink-faint">{shelf.length}</span>
              </span>
              <ChevronDownIcon className={`size-4 shrink-0 transition-transform ${shelfOpen ? "rotate-180" : ""}`} />
            </button>
            <ul className={`${shelfOpen ? "grid" : "hidden"} grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6`}>
              {shelf.map((badge) => {
                const mine = earned.get(badge.id);
                const on = badge.id === shown.id;
                return (
                  <li key={badge.id}>
                    <button
                      type="button"
                      onClick={() => {
                        hapticTap();
                        setOpenId(badge.id);
                      }}
                      aria-pressed={on}
                      title={mine ? badge.title : (badge.how ?? badge.title)}
                      className={`flex w-full flex-col items-center gap-2 rounded-xl border p-2.5 text-center transition-colors ${
                        on ? "border-current bg-navy-700" : mine ? "border-navy-500 bg-navy-800" : "border-dashed border-navy-600 bg-navy-900/40 hover:border-ink-faint"
                      }`}
                      style={on ? { color: `var(--color-${trophyColor(badge.id)})` } : undefined}
                    >
                      <TrophyStand id={badge.id} icon={badge.icon} won={!!mine} size="sm" />
                      <span className={`text-[0.6rem] font-semibold leading-tight ${mine ? "text-ink" : "text-ink-faint"}`}>
                        {badge.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-ink-muted">
            No trophies yet. Record a challenge - the first one is waiting.
          </p>
        )}
      </div>
    </div>
  );
}
