"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Lesson } from "@/data/lessons";
import type { Category } from "@/data/categories";
import { useStore } from "@/lib/store";
import { PlayIcon, CheckIcon } from "@/components/icons";

// Lessons as a vertical carousel of stills rather than a list of text.
// Each still is a frame from the middle of its own video, so a student
// scrolling the library sees a real person teaching rather than a wall
// of titles.

/** The still, falling back to the category color if the frame is missing. */
function LessonStill({
  vimeoId,
  category,
}: {
  vimeoId: string;
  category: Category;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`absolute inset-0 flex items-center justify-center ${category.bgClass} opacity-25`}
      >
        <PlayIcon className="size-6 text-navy-950" />
      </span>
    );
  }

  return (
    <Image
      src={`/thumbs/${vimeoId}.jpg`}
      alt=""
      fill
      sizes="(min-width: 640px) 176px, 128px"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function LessonCarousel({
  lessons,
  category,
}: {
  lessons: Lesson[];
  category: Category;
}) {
  const { state, ready } = useStore();
  const scrollerRef = useRef<HTMLUListElement>(null);

  return (
    <ul
      ref={scrollerRef}
      className="flex snap-y snap-mandatory flex-col gap-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-[70vh]"
    >
      {lessons.map((lesson, i) => {
        const watched = ready && state.watchedLessons.includes(lesson.vimeoId);
        return (
          <li key={lesson.vimeoId} className="snap-start">
            <Link
              href={`/skills/${category.id}/${lesson.vimeoId}`}
              className="group relative flex overflow-hidden rounded-xl border border-navy-600 bg-navy-800 transition-colors hover:border-ink-faint"
            >
              {/* still */}
              <div className="relative aspect-video w-32 shrink-0 bg-navy-950 sm:w-44">
                <LessonStill vimeoId={lesson.vimeoId} category={category} />
                <span className="absolute inset-0 flex items-center justify-center bg-navy-950/25 opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayIcon className="size-7 text-ink" />
                </span>
                {/* the category's color, tying the still to its skill */}
                <span
                  className={`absolute inset-x-0 bottom-0 h-1 ${category.bgClass}`}
                />
              </div>

              {/* title */}
              <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {watched && (
                    <span className="flex items-center gap-1 text-[0.65rem] font-medium text-mindset">
                      <CheckIcon className="size-3" />
                      Watched
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium leading-snug text-ink">
                  {lesson.title}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
