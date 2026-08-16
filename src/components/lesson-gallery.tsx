"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { lessons } from "@/data/lessons";
import { categories, categoryById } from "@/data/categories";
import type { CategoryId } from "@/data/categories";

// Every lesson in the course, on the landing page. The library is the
// bulk of what a buyer gets and it was previously invisible until after
// payment - so the whole shelf is laid out here, browsable by color.
// Deliberately not playable: this shows what's inside, it doesn't hand
// the course away.

type Filter = CategoryId | "all";

export function LessonGallery() {
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(
    () => (filter === "all" ? lessons : lessons.filter((l) => l.category === filter)),
    [filter],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <FilterChip
          label={`All ${lessons.length}`}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {categories.map((cat) => {
          const count = lessons.filter((l) => l.category === cat.id).length;
          return (
            <FilterChip
              key={cat.id}
              label={cat.name}
              count={count}
              dotClass={cat.bgClass}
              active={filter === cat.id}
              onClick={() => setFilter(cat.id)}
            />
          );
        })}
      </div>

      {/* A fixed-height scroller: the shelf stays the same size whichever
          color is chosen, and the list scrolls inside it rather than
          pushing the rest of the page down. */}
      <div className="h-[26rem] overflow-y-auto rounded-2xl border border-navy-600 bg-navy-900/40 p-3 sm:h-[24rem]">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shown.map((lesson) => {
            const cat = categoryById.get(lesson.category);
            return (
              <li key={lesson.vimeoId} className="flex flex-col gap-1.5">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-navy-950">
                  <Image
                    src={`/thumbs/${lesson.vimeoId}.jpg`}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 200px, 45vw"
                    loading="lazy"
                    className="object-cover"
                  />
                  <span
                    className={`absolute inset-x-0 bottom-0 h-0.5 ${cat?.bgClass ?? ""}`}
                  />
                </div>
                <span className="text-[0.7rem] leading-snug text-ink-muted">
                  {lesson.title}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-xs text-ink-faint">
        {shown.length} of {lessons.length} lessons - every one is one to two
        minutes. Watching unlocks with the course.
      </p>
    </div>
  );
}

function FilterChip({
  label,
  count,
  dotClass,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  dotClass?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-navy-500 bg-navy-700 text-ink"
          : "border-navy-600 text-ink-muted hover:text-ink"
      }`}
    >
      {dotClass && <span className={`size-2 rounded-full ${dotClass}`} />}
      {label}
      {count !== undefined && (
        <span className="tabular-nums text-ink-faint">{count}</span>
      )}
    </button>
  );
}
