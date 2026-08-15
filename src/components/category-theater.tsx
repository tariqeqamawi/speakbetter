"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/data/categories";
import type { Lesson } from "@/data/lessons";
import { takeaways } from "@/data/takeaways";
import { XP } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { VimeoPlayer } from "@/components/vimeo-player";
import { LessonWatched } from "@/components/lesson-watched";
import { VideoStill } from "@/components/video-still";
import { CheckIcon, XIcon, ZapIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";

// A category as a theater: whichever lesson is selected plays full
// width, and every other lesson in the color waits in a carousel below.
// Picking from the rail swaps the stage in place — browsing and watching
// are one motion, not a page apart.
//
// The gamification here is feedback-loop work, not slot-machine work:
// a progress ring that visibly closes, an XP receipt the moment a
// lesson counts, an up-next handoff that keeps a session rolling, and
// takeaways one tap away so a lesson ends with something to keep.

const UP_NEXT_SECONDS = 5;

export function CategoryTheater({
  category,
  lessons,
}: {
  category: Category;
  lessons: Lesson[];
}) {
  const { state, ready } = useStore();
  const [featuredId, setFeaturedId] = useState(lessons[0].vimeoId);
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [upNextIn, setUpNextIn] = useState<number | null>(null);
  const [xpFlash, setXpFlash] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // The full lesson page (transcript and all) has no preview twin, so
  // inside /demo the link would dead-end past the gate. Hide it there.
  const inDemo = usePathname().startsWith("/demo");

  const featured = lessons.find((l) => l.vimeoId === featuredId) ?? lessons[0];
  const index = lessons.findIndex((l) => l.vimeoId === featured.vimeoId);
  const next = lessons[index + 1];
  const watched = (id: string) => ready && state.watchedLessons.includes(id);
  const watchedCount = lessons.filter((l) => watched(l.vimeoId)).length;
  const points = takeaways[featured.vimeoId] ?? [];

  const select = (id: string, autoplay = false) => {
    setUpNextIn(null);
    setAutoplayNext(autoplay);
    setFeaturedId(id);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // The +XP receipt: the moment the featured lesson tips into "watched",
  // say so, right where it happened — the dashboard number should never
  // be the first place a student learns their work counted.
  const wasWatched = useRef(false);
  useEffect(() => {
    wasWatched.current = watched(featured.vimeoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured.vimeoId]);
  useEffect(() => {
    const now = watched(featured.vimeoId);
    if (now && !wasWatched.current) {
      wasWatched.current = true;
      setXpFlash(true);
      const t = setTimeout(() => setXpFlash(false), 2600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.watchedLessons, featured.vimeoId]);

  // Up-next countdown, cancellable. All state changes happen inside the
  // timer's callback — the effect itself only arms the clock.
  useEffect(() => {
    if (upNextIn === null) return;
    const t = setTimeout(() => {
      if (upNextIn <= 1) {
        if (next) select(next.vimeoId, true);
        else setUpNextIn(null);
      } else {
        setUpNextIn(upNextIn - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upNextIn]);

  // Close the panel with Escape, like any sheet should.
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanelOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  return (
    <div className="relative flex flex-col gap-5">
      {/* A wash of the category's own color behind the stage, so each
          color's room feels like its own place. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-16 h-80 opacity-25 blur-3xl"
        style={{
          background: `radial-gradient(60% 100% at 50% 0%, var(--color-${category.id}), transparent 70%)`,
        }}
      />

      {/* The stage */}
      <div ref={stageRef} className="relative flex scroll-mt-20 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {/* Progress ring: the category closing toward complete. */}
          <span className="relative size-9 shrink-0" title={`${watchedCount} of ${lessons.length} watched`}>
            <svg viewBox="0 0 36 36" className="size-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-navy-700" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                stroke={`var(--color-${category.id})`}
                strokeDasharray={`${(watchedCount / lessons.length) * 97.4} 97.4`}
                className="transition-[stroke-dasharray] duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold tabular-nums text-ink">
              {watchedCount}
            </span>
          </span>

          <span className={`font-mono text-sm tabular-nums ${category.textClass}`}>
            {String(index + 1).padStart(2, "0")} / {lessons.length}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {featured.title}
          </h2>
          {watched(featured.vimeoId) && (
            <span className="flex items-center gap-1 text-xs font-medium text-mindset">
              <CheckIcon className="size-3.5" />
              Watched
            </span>
          )}

          {/* The XP receipt */}
          {xpFlash && (
            <span className="xp-pop flex items-center gap-1 rounded-full bg-mindset/15 px-2.5 py-1 text-xs font-bold text-mindset">
              <ZapIcon className="size-3.5" />
              +{XP.lessonWatched} XP
            </span>
          )}

          <span className="ml-auto flex items-center gap-3">
            {points.length > 0 && (
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className={`flex min-h-9 items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-current ${category.textClass}`}
              >
                Key takeaways
              </button>
            )}
            {!inDemo && (
              <Link
                href={`/skills/${category.id}/${featured.vimeoId}`}
                className="text-xs font-semibold text-ink-faint transition-colors hover:text-ink-muted"
              >
                Open lesson page →
              </Link>
            )}
          </span>
        </div>

        {/* Keyed by lesson so the player rebuilds cleanly on each pick. */}
        <VimeoPlayer
          key={featured.vimeoId}
          vimeoId={featured.vimeoId}
          title={featured.title}
          autoplay={autoplayNext}
          onEnded={() => {
            if (next) setUpNextIn(UP_NEXT_SECONDS);
          }}
        />
        <LessonWatched key={`w-${featured.vimeoId}`} vimeoId={featured.vimeoId} />

        {/* Up next: a rolling session, with an exit. */}
        {upNextIn !== null && next && (
          <div className="coach-cue flex items-center gap-3 self-center rounded-full border border-navy-600 bg-navy-900/90 py-2 pl-4 pr-2">
            <span className="text-sm text-ink-muted">
              Up next:{" "}
              <b className="font-semibold text-ink">{next.title}</b>
              <span className="tabular-nums text-ink-faint"> · {upNextIn}s</span>
            </span>
            <button
              type="button"
              onClick={() => select(next.vimeoId, true)}
              className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-bold text-navy-950 ${category.bgClass}`}
            >
              Play now
            </button>
            <button
              type="button"
              onClick={() => setUpNextIn(null)}
              aria-label="Cancel autoplay"
              className="flex min-h-9 items-center px-1.5 text-ink-faint transition-colors hover:text-ink"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* The rail */}
      <div className="relative flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          All {lessons.length} lessons in this color
        </span>
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
          {lessons.map((lesson, i) => {
            const current = lesson.vimeoId === featured.vimeoId;
            return (
              <li
                key={lesson.vimeoId}
                className="challenge-enter w-44 shrink-0 snap-start sm:w-52"
                style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
              >
                <button
                  type="button"
                  onClick={() => select(lesson.vimeoId)}
                  aria-pressed={current}
                  className={`lift-card group flex w-full flex-col overflow-hidden rounded-xl border text-left ${category.textClass} ${
                    current
                      ? "border-current shadow-[0_0_18px_-6px_currentColor]"
                      : "border-navy-600 hover:border-current"
                  }`}
                >
                  <span className="relative block aspect-video w-full shrink-0 bg-gradient-to-br from-navy-700 to-navy-900">
                    <VideoStill
                      vimeoId={lesson.vimeoId}
                      accent={category}
                      sizes="208px"
                    />
                    <span
                      className={`absolute inset-0 flex items-center justify-center bg-navy-950/35 transition-opacity ${
                        current ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <PlayFillIcon className="size-7 text-ink" />
                    </span>
                    {current && (
                      <span
                        className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-navy-950 ${category.bgClass}`}
                      >
                        Playing
                      </span>
                    )}
                    {watched(lesson.vimeoId) && !current && (
                      <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-navy-950/85 text-mindset">
                        <CheckIcon className="size-3" />
                      </span>
                    )}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 ${category.bgClass} ${current ? "" : "opacity-40"}`}
                    />
                  </span>
                  <span className="flex flex-col gap-0.5 p-2.5">
                    <span className="font-mono text-[0.6rem] tabular-nums text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="line-clamp-2 text-xs font-medium leading-snug text-ink">
                      {lesson.title}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The takeaways sheet */}
      {panelOpen && (
        <>
          <button
            type="button"
            aria-label="Close takeaways"
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-label={`Key takeaways — ${featured.title}`}
            className="panel-in fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-5 overflow-y-auto border-l border-navy-600 bg-navy-850 p-6 shadow-2xl shadow-navy-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wider ${category.textClass}`}
                >
                  Key takeaways
                </span>
                <h3 className="text-lg font-semibold leading-snug text-ink">
                  {featured.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-navy-600 text-ink-muted transition-colors hover:text-ink"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <ul className="flex flex-col gap-3">
              {points.map((point, i) => (
                <li
                  key={i}
                  className="coach-cue flex items-start gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-navy-950 ${category.bgClass}`}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-ink-muted">{point}</p>
                </li>
              ))}
            </ul>

            <p className="text-xs leading-relaxed text-ink-faint">
              Written from this lesson&apos;s own transcript — the thing to
              carry into your next challenge.
            </p>

            {next && (
              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  select(next.vimeoId, true);
                }}
                className={`mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-navy-950 ${category.bgClass}`}
              >
                <PlayFillIcon className="size-4" />
                Next: {next.title}
              </button>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
