"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/data/categories";
import type { Lesson } from "@/data/lessons";
import { lessonXp } from "@/lib/progress";
import { XpBadge } from "@/components/xp-badge";
import { useStore } from "@/lib/store";
import { VimeoPlayer } from "@/components/vimeo-player";
import { LessonWatched } from "@/components/lesson-watched";
import { VideoStill } from "@/components/video-still";
import { CheckIcon, XIcon, ZapIcon } from "@/components/icons";
import { LessonCardButton } from "@/components/lesson-card-button";
import { PlayFillIcon } from "@/components/player-icons";

// A category as a theater: whichever lesson is selected plays full
// width, and every other lesson in the color waits in a carousel below.
// Picking from the rail swaps the stage in place - browsing and watching
// are one motion, not a page apart.
//
// The gamification here is feedback-loop work, not slot-machine work:
// a progress ring that visibly closes, an XP receipt the moment a
// lesson counts, an up-next handoff that keeps a session rolling, and
// the lesson's own card one tap away so a lesson ends with something to
// keep - the card says what the takeaways used to and says it better.


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
  const [upNext, setUpNext] = useState(false);
  const [xpFlash, setXpFlash] = useState(false);
  // What the featured lesson pays when it finishes - fixed the moment
  // it's selected, since it gets marked watched partway through and a
  // rewatch should play out in silence. See lesson-player.tsx.
  const [rewardFor, setRewardFor] = useState<string | null>(null);
  const [reward, setReward] = useState<number | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);
  // The full lesson page (transcript and all) has no preview twin, so
  // inside /demo the link would dead-end past the gate. Hide it there.
  const inDemo = usePathname().startsWith("/demo");

  const featured = lessons.find((l) => l.vimeoId === featuredId) ?? lessons[0];
  const index = lessons.findIndex((l) => l.vimeoId === featured.vimeoId);
  const next = lessons[index + 1];
  const watched = (id: string) => ready && state.watchedLessons.includes(id);
  const watchedCount = lessons.filter((l) => watched(l.vimeoId)).length;

  // Settled during render, before the video can reach its end.
  if (ready && rewardFor !== featured.vimeoId) {
    setRewardFor(featured.vimeoId);
    setReward(
      state.watchedLessons.includes(featured.vimeoId)
        ? undefined
        : lessonXp(featured.vimeoId),
    );
  }

  const select = (id: string, autoplay = false) => {
    setUpNext(false);
    setAutoplayNext(autoplay);
    setFeaturedId(id);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // The +XP receipt: the moment the featured lesson tips into "watched",
  // say so, right where it happened - the dashboard number should never
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
              +{lessonXp(featured.vimeoId)} XP
            </span>
          )}

          <span className="ml-auto flex items-center gap-3">
            <LessonCardButton vimeoId={featured.vimeoId} />
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
          xp={reward}
          onEnded={() => {
            if (next) setUpNext(true);
          }}
        />
        <LessonWatched key={`w-${featured.vimeoId}`} vimeoId={featured.vimeoId} />

        {/* Up next: offered, never taken. The lesson that just finished
            used to roll into the next one on a five second countdown,
            which decides for the student what they came here to decide -
            and in the challenges section, where only the lessons that
            serve the challenge are worth watching, it would carry them
            somewhere they never asked to go. So the next lesson waits
            behind a button, and the XP it's worth is on the button. */}
        {upNext && next && (
          <div className="coach-cue flex items-center gap-3 self-center rounded-full border border-navy-600 bg-navy-900/90 py-2 pl-4 pr-2">
            <span className="text-sm text-ink-muted">
              Up next: <b className="font-semibold text-ink">{next.title}</b>
            </span>
            <button
              type="button"
              onClick={() => select(next.vimeoId, true)}
              className={`flex min-h-9 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-navy-950 ${category.bgClass}`}
            >
              Play
              <ZapIcon className="size-3.5" />
              {lessonXp(next.vimeoId)}
            </button>
            <button
              type="button"
              onClick={() => setUpNext(false)}
              aria-label="Dismiss"
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
                    {/* What this one is worth, before it's watched -
                        each lesson its own small thing to complete. */}
                    {!watched(lesson.vimeoId) && (
                      <XpBadge
                        xp={lessonXp(lesson.vimeoId)}
                        className="absolute right-2 top-2 bg-navy-950/85"
                      />
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
    </div>
  );
}
