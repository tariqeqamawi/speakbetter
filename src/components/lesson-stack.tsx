"use client";

import { useState } from "react";
import { categories } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { lessonLength } from "@/lib/progress";
import { VideoStill } from "@/components/video-still";
import { PlayFillIcon } from "@/components/player-icons";

// The lessons as the app shows them: pick a colour, and its lessons
// stack one under another - thumbnail, number, title, how long it runs -
// the same list a student sees under "All lessons". A few of each, not
// all eighty-odd: enough to see what a colour holds.

const SHOWN = 5;

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

export function LessonStack() {
  const [id, setId] = useState(categories[0].id);
  const cat = categories.find((c) => c.id === id)!;
  const all = lessonsInCategory(id);
  const lessons = all.slice(0, SHOWN);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {/* The eight colours. */}
      <div role="tablist" aria-label="Colors" className="flex flex-wrap justify-center gap-1.5">
        {categories.map((c) => {
          const on = c.id === id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setId(c.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                on ? `border-current bg-navy-800 ${c.textClass}` : "border-navy-600 text-ink-faint hover:text-ink-muted"
              }`}
            >
              <span className={`size-2 rounded-full ${c.bgClass}`} />
              {c.name}
            </button>
          );
        })}
      </div>
      <p className={`text-center text-xs font-bold uppercase tracking-[0.18em] ${cat.textClass}`}>{cat.subtitle}</p>
      {/* Its lessons, as the app lists them. */}
      <ul className="flex flex-col gap-2.5">
        {lessons.map((l, i) => {
          const len = lessonLength(l.vimeoId);
          return (
            <li key={l.vimeoId} className="challenge-enter" style={{ animationDelay: `${i * 45}ms` }}>
              <div className={`flex items-center gap-3 overflow-hidden rounded-xl border border-navy-600 pr-3 ${cat.textClass}`}>
                <span className="relative block aspect-video w-32 shrink-0 bg-gradient-to-br from-navy-700 to-navy-900">
                  <VideoStill vimeoId={l.vimeoId} accent={cat} sizes="128px" />
                  <span className="absolute inset-0 grid place-items-center bg-navy-950/25">
                    <PlayFillIcon className="size-5 text-ink" />
                  </span>
                  {len !== undefined && (
                    <span className="absolute bottom-1 right-1 rounded bg-navy-950/85 px-1 py-0.5 font-mono text-[0.55rem] tabular-nums text-ink">
                      {clock(len)}
                    </span>
                  )}
                  <span className={`absolute inset-x-0 bottom-0 h-0.5 ${cat.bgClass}`} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 py-2 text-left">
                  <span className="font-mono text-[0.6rem] tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">{l.title}</span>
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
