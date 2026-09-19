"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { lessons } from "@/data/lessons";
import { CategoryIcon } from "@/components/category-icons";
import { ChevronDownIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";

// The library, shown the way a streaming shelf shows a season: pick a
// color, and one lesson sits large in the middle with its title said
// plainly, the rest of the color running beneath as a strip you arrow
// or scroll through. Every lesson in the course is here, nothing
// hidden behind the checkout - and a visitor can see in ten seconds
// how much there is and what it looks like.

export function LessonGallery() {
  const [color, setColor] = useState<CategoryId>("storytelling");
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLUListElement>(null);

  const shown = useMemo(() => lessons.filter((l) => l.category === color), [color]);
  const cat = categoryById.get(color)!;
  const current = shown[Math.min(index, shown.length - 1)];

  const go = useCallback(
    (d: number) => setIndex((i) => (i + d + shown.length) % shown.length),
    [shown.length],
  );

  // The strip keeps the chosen lesson in view.
  useEffect(() => {
    const el = strip.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index, color]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
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

      {/* The one in the middle, large, its title announced. */}
      <div className={`relative overflow-hidden rounded-2xl border border-navy-600 bg-navy-950 ${cat.textClass}`}>
        <div className="relative aspect-video w-full">
          <Image
            key={current.vimeoId}
            src={`/thumbs/${current.vimeoId}.jpg`}
            alt=""
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            className="gallery-in object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous lesson"
            className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-navy-950/60 text-ink backdrop-blur-sm transition-colors hover:bg-navy-950/80"
          >
            <ChevronDownIcon className="size-5 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next lesson"
            className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-navy-950/60 text-ink backdrop-blur-sm transition-colors hover:bg-navy-950/80"
          >
            <ChevronDownIcon className="size-5 -rotate-90" />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.3em]">
                <CategoryIcon category={color} className="size-3.5" />
                {cat.name}
                <span className="text-ink-faint">· {index + 1} of {shown.length}</span>
              </span>
              <h3 key={current.vimeoId} className="gallery-in text-2xl font-semibold tracking-tight text-ink text-balance sm:text-3xl">
                {current.title}
              </h3>
              <span className="text-xs text-ink-muted">One to two minutes · taught to camera · yours from day one</span>
            </div>
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-white/25 bg-navy-950/70 text-ink">
              <PlayFillIcon className="size-6 translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* The strip: the whole color, scrolled or arrowed. */}
      <ul
        ref={strip}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shown.map((lesson, i) => {
          const on = i === index;
          return (
            <li key={lesson.vimeoId} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={lesson.title}
                aria-current={on ? "true" : undefined}
                className={`relative block aspect-video w-36 overflow-hidden rounded-lg bg-navy-950 transition-[transform,box-shadow] ${
                  on ? `scale-105 ring-2 ring-current shadow-[0_0_20px_-6px_currentColor] ${cat.textClass}` : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={`/thumbs/${lesson.vimeoId}.jpg`} alt="" fill sizes="144px" className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-navy-950 to-transparent px-1.5 pb-1 pt-4 text-left text-[0.6rem] font-medium text-ink">
                  {lesson.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
