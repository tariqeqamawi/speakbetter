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
    };
  });

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
          {cells.map((cell) => (
            <span
              key={cell.key}
              title={`${cell.key}${cell.wasFrozen ? " - freeze used" : cell.practiced ? " - practiced" : ""}`}
              className={`flex aspect-square items-center justify-center rounded-lg border text-[0.6rem] tabular-nums ${
                cell.inFuture
                  ? "border-navy-700 text-navy-600"
                  : cell.wasFrozen
                    ? "border-body-language/40 bg-body-language/15 text-body-language"
                    : cell.practiced
                      ? "border-mindset/50 bg-mindset/20 text-mindset"
                      : "border-navy-700 bg-navy-900 text-ink-faint"
              } ${cell.isToday ? "ring-1 ring-ink-faint" : ""}`}
            >
              {cell.practiced && !cell.wasFrozen ? (
                <CheckIcon className="size-3.5" />
              ) : (
                cell.dayOfMonth
              )}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        A green check is a day you practiced. Cyan is a day a freeze covered
        for you - one missed day never costs the streak.
      </p>
      </div>
    </div>
  );
}
