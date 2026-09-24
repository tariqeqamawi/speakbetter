"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { lessons } from "@/data/lessons";
import { lessonMinutes } from "@/lib/progress";
import { CategoryIcon } from "@/components/category-icons";
import { ChevronDownIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";

// The library, color by color. Pick a color and its lessons cascade
// down one side - every title, in order - while the other side previews
// the color itself: its name, what it teaches, how many lessons and
// minutes, and the chosen lesson's still, large but not full-width (the
// stills are lesson-sized, not poster-sized). On a phone the cascade
// turns into a strip beneath the still. A visitor can see in ten
// seconds how much there is, what each color is for, and what it
// looks like - every lesson in the course, nothing hidden behind the
// checkout.

export function LessonGallery() {
  const [color, setColor] = useState<CategoryId>("storytelling");
  const [index, setIndex] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const shown = useMemo(() => lessons.filter((l) => l.category === color), [color]);
  const cat = categoryById.get(color)!;
  const current = shown[Math.min(index, shown.length - 1)];
  const minutes = useMemo(
    () => Math.round(shown.reduce((sum, l) => sum + lessonMinutes(l.vimeoId), 0)),
    [shown],
  );

  const go = useCallback(
    (d: number) => setIndex((i) => (i + d + shown.length) % shown.length),
    [shown.length],
  );

  // The cascade keeps the chosen lesson in view.
  useEffect(() => {
    const el = list.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index, color]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div className="flex w-full flex-col gap-5">
      {/* The colors, as a row of tabs - jump straight to a section. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const on = c.id === color;
          const count = lessons.filter((l) => l.category === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setColor(c.id);
                setIndex(0);
              }}
              aria-pressed={on}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                on
                  ? `border-current bg-navy-800 ${c.textClass} shadow-[0_0_18px_-6px_currentColor]`
                  : "border-navy-600 text-ink-muted hover:border-ink-faint hover:text-ink"
              }`}
            >
              <CategoryIcon category={c.id} className="size-4" />
              {c.short}
              <span className={`text-xs tabular-nums ${on ? "opacity-80" : "text-ink-faint"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className={`grid gap-4 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] ${cat.textClass}`}>
        {/* The cascade: the whole color, every title, scrolled or arrowed.
            On a wide screen it runs the full height of the preview beside
            it - h-0 so it adds nothing to the row, min-h-full so it then
            fills the row the preview made. A fixed height here left the
            preview towering over an empty column once it grew to the
            card's full width. */}
        <ul
          ref={list}
          className="order-2 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:order-1 sm:mx-0 sm:h-0 sm:min-h-full sm:flex-col sm:overflow-y-auto sm:px-0 sm:pb-0 sm:pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:hidden sm:[&::-webkit-scrollbar]:block"
        >
          {shown.map((lesson, i) => {
            const on = i === index;
            return (
              <li key={lesson.vimeoId} className="shrink-0 sm:shrink">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={on ? "true" : undefined}
                  className={`flex h-full w-36 flex-col gap-1 rounded-lg border p-1 text-left transition-colors sm:w-full sm:flex-row sm:items-center sm:gap-3 sm:p-1.5 ${
                    on ? "border-current bg-navy-800" : "border-transparent hover:bg-navy-800/70"
                  }`}
                >
                  <span className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-navy-950 sm:w-20">
                    <Image src={`/thumbs/${lesson.vimeoId}.jpg`} alt="" fill sizes="(min-width: 640px) 80px, 144px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    {/* Wrapped, not truncated.
                        
                        On a phone every title in this rail was cut off
                        with an ellipsis - "Storytelling: Don't Tell
                        it, Relive The Experie…" - which is the one
                        place a truncation costs the most, because the
                        title IS the lesson. A visitor scrolling the
                        library on their phone was being shown eighty
                        one half-titles as evidence of what they would
                        be buying. Two lines and it fits; a title long
                        enough to need a third is clipped there, which
                        is a fair trade in a card this size. */}
                    <span className={`line-clamp-2 text-xs font-medium leading-snug ${on ? "text-ink" : "text-ink-muted"}`}>
                      {lesson.title}
                    </span>
                    <span className="hidden text-[0.65rem] tabular-nums text-ink-faint sm:block">
                      {i + 1} of {shown.length}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* The color, previewed: what it is, and the chosen lesson large. */}
        <div className="order-1 flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800/60 p-4 sm:order-2 sm:p-5">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.3em]">
              <CategoryIcon category={color} className="size-3.5" />
              {cat.colorName}
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-ink">{cat.name}</h3>
            <p className="text-sm text-ink-muted">{cat.blurb}</p>
            <span className="text-xs text-ink-faint">
              {shown.length} lessons · about {minutes} minutes · one to two minutes each · yours from day one
            </span>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl border border-navy-600 bg-navy-950">
            <div className="relative aspect-video w-full">
              <Image
                key={current.vimeoId}
                src={`/thumbs/${current.vimeoId}.jpg`}
                alt=""
                fill
                sizes="(min-width: 640px) 720px, 100vw"
                className="gallery-in object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent" />
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous lesson"
                className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-navy-950/60 text-ink transition-colors hover:bg-navy-950/80"
              >
                <ChevronDownIcon className="size-5 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next lesson"
                className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-navy-950/60 text-ink transition-colors hover:bg-navy-950/80"
              >
                <ChevronDownIcon className="size-5 -rotate-90" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em]">
                    Lesson {index + 1} of {shown.length}
                  </span>
                  <h4 key={current.vimeoId} className="gallery-in text-lg font-semibold tracking-tight text-ink text-balance sm:text-xl">
                    {current.title}
                  </h4>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/25 bg-navy-950/70 text-ink">
                  <PlayFillIcon className="size-5 translate-x-0.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
