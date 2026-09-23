"use client";

import { currentStreak } from "@/data/badges";
import { longestStreak, practiceDays } from "@/lib/progress";
import type { AppState } from "@/lib/store";
import { CheckIcon, FlameIcon } from "@/components/icons";
import { SectionBanner } from "@/components/section-banner";

// The streak, as the thing it actually is: days. A number says "4"; a
// calendar shows the run, the gap a freeze covered, and how much of the
// month is still there to fill.

const WEEKS = 5;
const DAY = 86_400_000;

function iso(d: number) {
  return new Date(d).toISOString().slice(0, 10);
}

/** The cascade, in the spectrum's order. */
const STREAK_COLORS = ["mindset", "body-language", "storytelling", "figurative", "acting", "structure", "advanced"] as const;

export function StreakCalendar({ state }: { state: AppState }) {
  const days = practiceDays(state);
  const frozen = new Set(state.frozenDays);
  const streak = currentStreak(state);
  const best = longestStreak(state);

  const todayIso = new Date().toISOString().slice(0, 10);
  const today = Date.parse(todayIso);
  // End the grid on today, and start it on the Monday WEEKS-1 weeks back,
  // so the columns line up under their weekday letters.
  const dow = (new Date(todayIso).getUTCDay() + 6) % 7; // Monday = 0
  const start = today - (dow + (WEEKS - 1) * 7) * DAY;

  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const ts = start + i * DAY;
    const key = iso(ts);
    return {
      key,
      inFuture: ts > today,
      isToday: key === todayIso,
      practiced: days.has(key),
      wasFrozen: frozen.has(key),
      dayOfMonth: new Date(ts).getUTCDate(),
      /** Position in the running streak, 0 at its first day; -1 outside it. */
      inStreak: -1,
    };
  });
  // The running streak's days, oldest first: walking back from today
  // (or yesterday, if today isn't done yet) over practiced or frozen
  // days. A glow cascades along them, one to the next.
  let streakLen = 0;
  {
    let end = cells.findIndex((c) => c.isToday);
    if (end >= 0 && !cells[end].practiced && !cells[end].wasFrozen) end -= 1;
    for (let i = end; i >= 0 && streakLen < streak; i--) {
      if (!cells[i].practiced && !cells[i].wasFrozen) break;
      streakLen++;
    }
    for (let k = 0; k < streakLen; k++) cells[end - streakLen + 1 + k].inStreak = k;
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner
        image="/sections/streak.jpg"
        title="Your streak"
        Icon={FlameIcon}
        accentClass="text-acting"
        large
      />
      <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-navy-900">
          <FlameIcon
            className={`size-5 ${streak > 0 ? "text-acting" : "text-ink-faint"}`}
          />
        </span>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums leading-none text-ink">
            {streak}
            <span className="text-sm font-normal text-ink-faint">
              {" "}
              day{streak === 1 ? "" : "s"} running
            </span>
          </span>
          <span className="text-xs text-ink-faint">
            Longest {best} · {state.freezesRemaining} freeze
            {state.freezesRemaining === 1 ? "" : "s"} left
          </span>
        </div>
      </div>

      <div>
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span
              key={i}
              className="text-center text-[0.6rem] font-medium text-ink-faint"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) => {
            // A day inside the running streak wears the next color of
            // the spectrum, so a long streak reads as a cascade through
            // all seven rather than a block of green - the streak is the
            // student widening, and the calendar can say so.
            const hue = cell.inStreak >= 0 ? STREAK_COLORS[cell.inStreak % STREAK_COLORS.length] : null;
            const color = cell.wasFrozen ? "var(--color-body-language)" : hue ? `var(--color-${hue})` : "var(--color-mindset)";
            return (
            <span
              key={cell.key}
              title={`${cell.key}${cell.wasFrozen ? " - freeze used" : cell.practiced ? " - practiced" : ""}`}
              style={
                cell.inFuture || (!cell.practiced && !cell.wasFrozen)
                  ? undefined
                  : {
                      color,
                      borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
                      background: `color-mix(in oklab, ${color} 18%, transparent)`,
                    }
              }
              className={`relative flex aspect-square items-center justify-center rounded-lg border text-[0.6rem] tabular-nums ${
                cell.inFuture
                  ? "border-navy-700 text-navy-600"
                  : cell.practiced || cell.wasFrozen
                    ? ""
                    : "border-navy-700 bg-navy-900 text-ink-faint"
              } ${cell.isToday ? "ring-1 ring-ink-faint" : ""}`}
            >
              {cell.inStreak >= 0 && (
                <span
                  aria-hidden
                  className="streak-glow pointer-events-none absolute inset-0 rounded-lg"
                  style={{
                    boxShadow: `0 0 14px 2px ${color}`,
                    animationDelay: `${cell.inStreak * 0.16}s`,
                    animationDuration: `${Math.max(2.4, streakLen * 0.16 + 1.8)}s`,
                  }}
                />
              )}
              {cell.practiced && !cell.wasFrozen ? (
                <CheckIcon className="size-3.5" />
              ) : (
                cell.dayOfMonth
              )}
            </span>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        Every day you practice takes the next color of the spectrum. Cyan is a day a freeze covered
        for you - one missed day never costs the streak.
      </p>
      </div>
    </div>
  );
}
