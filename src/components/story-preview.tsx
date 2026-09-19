"use client";

import Image from "next/image";
import { useState } from "react";
import { challengesInPhase, maxSecondsFor, storyPhases, type PhaseId } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById } from "@/data/categories";
import { CategoryChip } from "@/components/category-chip";
import { XpBadge } from "@/components/xp-badge";
import { challengeXp } from "@/lib/progress";
import { CircleIcon, UploadIcon, VideoIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";

// The STORY journey on the landing page, opened up. A visitor shouldn't
// have to buy the course to find out what's in it: pick a phase, pick a
// challenge, and its page appears the way the app shows it - the brief,
// the explainer's still, what passing takes, the lessons to warm up
// with, and the record and upload buttons. Not thumbnails of the
// videos, the page itself.

export function StoryPreview() {
  const [active, setActive] = useState<PhaseId>("S");
  const [slug, setSlug] = useState<string | null>(null);
  const phase = storyPhases.find((p) => p.id === active) ?? storyPhases[0];
  const challenges = challengesInPhase(active);
  const challenge = challenges.find((c) => c.slug === slug) ?? challenges[0];
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
                onClick={() => {
                  setActive(p.id);
                  setSlug(null);
                }}
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

      <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-start">
        {/* This phase's challenges, as a list to pick from */}
        <div className={`flex flex-col gap-2 rounded-2xl border bg-navy-800/60 p-3 ${phase.borderClass}`}>
          <div className="flex items-baseline gap-2 px-1">
            <span className={`text-lg font-bold ${phase.textClass}`}>{phase.id}</span>
            <h3 className="text-sm font-semibold text-ink">{phase.name}</h3>
          </div>
          <p className="px-1 text-xs text-ink-muted">{phase.tagline}</p>
          <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-col sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {challenges.map((c, i) => {
              const on = c.slug === challenge.slug;
              return (
                <li key={c.slug} className="shrink-0 sm:shrink">
                  <button
                    type="button"
                    onClick={() => setSlug(c.slug)}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                      on
                        ? `border-current bg-navy-800 text-ink ${phase.textClass}`
                        : "border-navy-600 text-ink-muted hover:border-ink-faint hover:text-ink"
                    }`}
                  >
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border border-current text-[0.6rem] font-bold ${on ? phase.textClass : "text-ink-faint"}`}>
                      {i + 1}
                    </span>
                    <span className="max-w-[11rem] truncate text-ink sm:max-w-none sm:whitespace-normal">{c.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

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
