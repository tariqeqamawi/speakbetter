"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { JourneyMap } from "@/components/journey-map";
import { demoState } from "@/lib/demo-state";
import { challengeBySlug, challengesInPhase, maxSecondsFor, storyPhases, type PhaseId } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById } from "@/data/categories";
import { CategoryChip } from "@/components/category-chip";
import { XpBadge } from "@/components/xp-badge";
import { challengeXp } from "@/lib/progress";
import { CircleIcon, UploadIcon, VideoIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";

// The STORY journey on the landing page, opened up. A visitor shouldn't
// have to buy the course to find out what's in it, and the journey map
// is the thing Speak Better has that nothing else does - so here it is,
// live, in a phone: a worked-in student's road, their face on the
// challenge they're at, their takes and trophies pinned where they were
// won, pinch-zoomable. Tap a node (or a phase above) and the challenge's
// page appears beside it the way the app shows it - the brief, the
// explainer's still, what passing takes, the lessons to warm up with,
// and the record and upload buttons.

export function StoryPreview() {
  const [active, setActive] = useState<PhaseId>("S");
  const [slug, setSlug] = useState<string | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const phase = storyPhases.find((p) => p.id === active) ?? storyPhases[0];
  const challenges = challengesInPhase(active);
  const challenge = challenges.find((c) => c.slug === slug) ?? challenges[0];

  // A phase chosen above scrolls the phone's map to that level.
  const showPhase = (id: PhaseId) => {
    setActive(id);
    setSlug(null);
    const f = frame.current;
    const el = f?.querySelector<HTMLElement>(`#journey-${id}`);
    if (f && el) {
      const top = el.getBoundingClientRect().top - f.getBoundingClientRect().top + f.scrollTop - 56;
      f.scrollTo({ top, behavior: "smooth" });
    }
  };
  // A node tapped on the map opens its page beside it.
  const pick = (s: string) => {
    const c = challengeBySlug.get(s);
    if (!c) return;
    setActive(c.phase);
    setSlug(s);
  };
  const warmUp = challenge.relatedLessonIds.map((id) => lessonByVimeoId.get(id)).filter((l) => l !== undefined);
  const limit = maxSecondsFor(challenge);
  const limitLabel = limit % 60 === 0 ? `${limit / 60} minute${limit === 60 ? "" : "s"}` : `${limit} seconds`;

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4">
      {/* The phases */}
      <ol className="grid w-full grid-cols-5 gap-2 sm:gap-3">
        {storyPhases.map((p) => {
          const selected = p.id === active;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => showPhase(p.id)}
                aria-pressed={selected}
                className={`flex w-full flex-col items-center gap-0.5 rounded-xl border p-2.5 text-center transition-[transform,opacity] sm:p-4 ${p.borderClass} ${p.tintClass} ${
                  selected ? "scale-[1.03]" : "opacity-60 hover:opacity-100"
                }`}
              >
                <span className="text-xl font-bold text-ink">{p.id}</span>
                <span className="hidden text-xs font-medium text-ink-muted sm:block">{p.name}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-start">
        {/* The map itself, live, in a phone. Scroll it, pinch it, tap a
            node. */}
        <figure className="flex flex-col items-center gap-2 lg:sticky lg:top-24">
          <div className="relative w-full max-w-[19rem] rounded-[2.2rem] border-4 border-navy-600 bg-navy-950 p-1.5 shadow-2xl shadow-navy-950">
            <span className="absolute left-1/2 top-3 z-50 h-1.5 w-14 -translate-x-1/2 rounded-full bg-navy-700" />
            <div
              ref={frame}
              className="relative h-[34rem] overflow-y-auto overscroll-contain rounded-[1.8rem] bg-navy-950 px-3 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <JourneyMap preview={demoState} onPick={pick} />
            </div>
          </div>
          <figcaption className="text-center text-xs text-ink-muted">
            A student five challenges in - their face on the road, their trophies where they won them.
            <span className="block text-ink-faint">Scroll, pinch to look closer, tap a stop.</span>
          </figcaption>
        </figure>

        {/* The challenge's page, as the app lays it out */}
        <div key={challenge.slug} className="gallery-in flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-900 p-4 sm:p-5">
          <header className="flex flex-col gap-1.5">
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-ink-faint">
              {phase.id} - {phase.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h3 className="text-xl font-semibold tracking-tight text-balance">{challenge.title}</h3>
              <XpBadge xp={challengeXp(challenge)} size="md" upTo={!challenge.passive} className={`border border-navy-600 ${phase.textClass}`} />
            </div>
            <p className="text-sm text-ink-muted">{challenge.brief}</p>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              {challenge.targetSkills.map((skill) => (
                <CategoryChip key={skill} category={skill} />
              ))}
            </div>
          </header>

          {challenge.vimeoId && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-navy-950">
              <Image src={`/thumbs/${challenge.vimeoId}.jpg`} alt="" fill sizes="(min-width: 640px) 560px, 100vw" className="object-cover" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-12 place-items-center rounded-full border border-white/25 bg-navy-950/70 text-ink">
                  <PlayFillIcon className="size-5 translate-x-0.5" />
                </span>
              </span>
              <span className="absolute left-3 top-3 rounded-full bg-navy-950/70 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink-muted">
                Watch the challenge
              </span>
            </div>
          )}

          <section className="rounded-xl border border-navy-600 bg-navy-800 p-3.5">
            <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">What success looks like</h4>
            <ul className="flex flex-col gap-1">
              {challenge.criteria.map((criterion) => (
                <li key={criterion} className="flex items-start gap-2 text-sm text-ink">
                  <CircleIcon className="mt-1 size-3.5 shrink-0 text-ink-faint" />
                  {criterion}
                </li>
              ))}
            </ul>
          </section>

          {warmUp.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <h4 className="text-xs font-medium uppercase tracking-wider text-ink-faint">Warm up - a few minutes of skills</h4>
              <ul className="flex flex-col gap-1.5">
                {warmUp.map((lesson) => {
                  const cat = categoryById.get(lesson.category)!;
                  return (
                    <li key={lesson.vimeoId} className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm">
                      <span className="relative aspect-video w-14 shrink-0 overflow-hidden rounded bg-navy-950">
                        <Image src={`/thumbs/${lesson.vimeoId}.jpg`} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span className={`size-2 shrink-0 rounded-full ${cat.bgClass}`} />
                      <span className="flex-1 truncate font-medium text-ink">{lesson.title}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="flex flex-col items-start gap-2.5 rounded-xl border border-navy-600 bg-navy-800 p-4">
            <p className="text-xs text-ink-muted">
              Record yourself here - selfie mode, {limitLabel} at most - or choose one you&apos;ve already recorded,
              and your coach will review it.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="#try"
                className="inline-flex items-center gap-2 rounded-lg bg-acting px-4 py-2 text-sm font-semibold text-navy-900 shadow-[0_0_22px_-4px_var(--color-acting)] transition-[box-shadow,opacity] hover:opacity-90"
              >
                <VideoIcon className="size-4" />
                Record
              </a>
              <a
                href="#try"
                className="inline-flex items-center gap-2 rounded-lg border border-body-language px-4 py-2 text-sm font-semibold text-body-language shadow-[0_0_18px_-6px_var(--color-body-language)] transition-[box-shadow,background-color] hover:bg-body-language/10"
              >
                <UploadIcon className="size-4" />
                Upload
              </a>
            </div>
            <p className="text-[0.65rem] text-ink-faint">
              The first challenge is free to record and have reviewed - the buttons take you there.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
