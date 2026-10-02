"use client";

import { useState } from "react";
import { categories } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { lessonLength } from "@/lib/progress";
import { VideoStill } from "@/components/video-still";
import { PlayFillIcon } from "@/components/player-icons";
import { ChevronDownIcon } from "@/components/icons";

// The lessons as the app shows them: a colour, and its lessons stacked
// one under another - thumbnail, number, title, how long it runs - the
// same list a student sees under "All lessons". A few of each, not all
// eighty-odd: enough to see what a colour holds.
//
// On a laptop three colours stand side by side (Tell, Paint, Act...) and
// the arrows at either end step along the eight one at a time, wrapping
// round; on a phone it's one colour with the arrows either side of it.
// The chips above jump straight to any colour.

const SHOWN = 5;
const N = categories.length;

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

function Column({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  const cat = categories[index];
  const all = lessonsInCategory(cat.id);
  const lessons = all.slice(0, SHOWN);
  return (
    <div
      className={`challenge-enter flex min-w-0 flex-col gap-2.5 ${className}`}
    >
      <div className="flex flex-col items-center gap-0.5 pb-1 text-center">
        <span
          className={`flex items-center gap-2 text-lg font-bold tracking-tight ${cat.textClass}`}
        >
          <span className={`size-2.5 rounded-full ${cat.bgClass}`} />
          {cat.name}
        </span>
        <span
          className={`text-[0.65rem] font-bold uppercase tracking-[0.18em] opacity-80 ${cat.textClass}`}
        >
          {cat.subtitle}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {lessons.map((l, i) => {
          const len = lessonLength(l.vimeoId);
          return (
            <li key={l.vimeoId}>
              <div
                className={`flex items-center gap-3 overflow-hidden rounded-xl border border-navy-600 pr-3 ${cat.textClass}`}
              >
                <span className="relative block aspect-video w-28 shrink-0 bg-gradient-to-br from-navy-700 to-navy-900">
                  <VideoStill vimeoId={l.vimeoId} accent={cat} sizes="112px" />
                  <span className="absolute inset-0 grid place-items-center bg-navy-950/25">
                    <PlayFillIcon className="size-5 text-ink" />
                  </span>
                  {len !== undefined && (
                    <span className="absolute bottom-1 right-1 rounded bg-navy-950/85 px-1 py-0.5 font-mono text-[0.55rem] tabular-nums text-ink">
                      {clock(len)}
                    </span>
                  )}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-0.5 ${cat.bgClass}`}
                  />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 py-2 text-left">
                  <span className="font-mono text-[0.6rem] tabular-nums text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">
                    {l.title}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {all.length > SHOWN && (
        <p className="text-center text-xs text-ink-faint">
          + {all.length - SHOWN} more in {cat.name}
        </p>
      )}
    </div>
  );
}

function Arrow({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous color" : "Next color"}
      className="grid size-10 shrink-0 place-items-center self-center rounded-full border border-navy-600 bg-navy-900/80 text-ink-muted transition-colors hover:border-ink-faint hover:text-ink lg:size-12"
    >
      <ChevronDownIcon
        className={`size-5 ${dir === "prev" ? "rotate-90" : "-rotate-90"}`}
      />
    </button>
  );
}

export function LessonStack() {
  const [start, setStart] = useState(0);
  const at = (k: number) => (((start + k) % N) + N) % N;

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5">
      {/* The eight colours: the ones on show are lit (three on a laptop). */}
      <div
        role="tablist"
        aria-label="Colors"
        className="flex flex-wrap justify-center gap-1.5"
      >
        {categories.map((c, i) => {
          const first = i === start;
          const alsoShown = i === at(1) || i === at(2);
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={first}
              onClick={() => setStart(i)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                first
                  ? `border-current bg-navy-800 ${c.textClass}`
                  : alsoShown
                    ? "border-navy-600 text-ink-faint hover:text-ink-muted lg:border-ink-faint lg:bg-navy-800 lg:text-ink"
                    : "border-navy-600 text-ink-faint hover:text-ink-muted"
              }`}
            >
              <span className={`size-2 rounded-full ${c.bgClass}`} />
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 sm:gap-4">
        <Arrow dir="prev" onClick={() => setStart(at(-1))} />
        <div className="grid min-w-0 flex-1 gap-5 lg:grid-cols-3">
          <Column key={`a-${at(0)}`} index={at(0)} />
          <Column key={`b-${at(1)}`} index={at(1)} className="hidden lg:flex" />
          <Column key={`c-${at(2)}`} index={at(2)} className="hidden lg:flex" />
        </div>
        <Arrow dir="next" onClick={() => setStart(at(1))} />
      </div>
    </div>
  );
}
