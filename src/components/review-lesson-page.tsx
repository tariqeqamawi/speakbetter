"use client";

import Link from "next/link";
import { useStore, type Attempt } from "@/lib/store";
import { challengeBySlug } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById, type CategoryId } from "@/data/categories";
import { LessonPlayer } from "@/components/lesson-player";
import { LessonGate } from "@/components/lesson-gate";
import { LessonLink } from "@/components/practice-panel";
import { XpBadge } from "@/components/xp-badge";
import { lessonXp } from "@/lib/progress";
import { ChevronDownIcon } from "@/components/icons";

// The lessons Coach named in one review, and nothing else: the chosen
// one playing, the others a tap away, and "Back to your review" at the
// top and the bottom. A student who follows a note into a lesson should
// come out where they went in.

export function ReviewLessonPage({
  id,
  vimeoId,
  sample,
}: {
  id: string;
  vimeoId: string;
  /** The sample review's attempt (/demo/review), with its page's path. */
  sample?: { attempt: Attempt; backHref: string };
}) {
  const { state, ready } = useStore();
  if (!ready) return null;
  const attempt = sample?.attempt ?? state.attempts.find((a) => a.id === id);
  const reviewHref = sample?.backHref ?? `/review/${id}`;
  const lessonHref = (lid: string) => (sample ? `${sample.backHref}/lessons/${lid}` : `/review/${id}/lessons/${lid}`);
  const lesson = lessonByVimeoId.get(vimeoId);
  const challenge = attempt && challengeBySlug.get(attempt.challengeSlug);
  if (!attempt || !lesson || !challenge) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">That lesson isn&apos;t in a review here</h1>
        <Link href="/coach" className="w-fit rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900">
          Go to Coach
        </Link>
      </div>
    );
  }

  // Every lesson the review named, in the order the review names them:
  // the ones the challenge asked for, the ones spotted, then the ones
  // behind the notes.
  const ids: string[] = [];
  const add = (lid?: string) => {
    if (lid && lessonByVimeoId.has(lid) && !ids.includes(lid)) ids.push(lid);
  };
  attempt.lessonsUsed?.forEach((l) => add(l.lessonId));
  attempt.skillsSpotted?.forEach((s) => add(s.lessonId));
  const notes = [...(attempt.strengths ?? []), ...attempt.focus, ...attempt.fullNotes];
  notes.forEach((n) => n.lessonIds?.forEach(add));
  add(vimeoId);
  const others = ids.filter((lid) => lid !== vimeoId).map((lid) => lessonByVimeoId.get(lid)!);
  const cat = categoryById.get(lesson.category as CategoryId)!;
  const used = attempt.lessonsUsed?.find((l) => l.lessonId === vimeoId);
  const spotted = attempt.skillsSpotted?.find((s) => s.lessonId === vimeoId);
  const note = notes.find((n) => n.lessonIds?.includes(vimeoId));
  const why = used?.evidence ?? spotted?.evidence ?? note?.note;
  const whyLabel = used
    ? used.used
      ? `Used - ${used.quality}/10`
      : "Not used this time"
    : spotted
      ? `Spotted at ${spotted.at ?? "a moment"} - ${spotted.quality}/10`
      : "Coach said";

  const back = (
    <Link
      href={reviewHref}
      className="flex min-h-11 w-fit items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
    >
      <ChevronDownIcon className="size-4 rotate-90" />
      Back to your review
    </Link>
  );

  return (
    <div className="flex flex-col gap-6 py-6">
      {back}
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          From Coach&apos;s review of {challenge.title}
        </p>
        <div className={`h-1 w-14 rounded-full ${cat.bgClass}`} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{lesson.title}</h1>
          <XpBadge xp={lessonXp(lesson.vimeoId)} size="md" className={`border border-navy-600 ${cat.textClass}`} />
        </div>
        {/* Why Coach named it - so the lesson is watched with the
            moment in mind. */}
        {why && (
          <p className={`rounded-xl border border-navy-600 bg-navy-800 px-4 py-3 text-sm ${cat.textClass}`}>
            <span className="mr-2 text-[0.65rem] font-bold uppercase tracking-wider">{whyLabel}</span>
            <span className="text-ink">{why}</span>
          </p>
        )}
      </header>

      <LessonGate vimeoId={lesson.vimeoId}>
        <LessonPlayer vimeoId={lesson.vimeoId} title={lesson.title} />
      </LessonGate>

      {others.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">The other lessons in this review</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((l) => (
              <LessonLink key={l.vimeoId} lesson={l} href={lessonHref(l.vimeoId)} />
            ))}
          </div>
        </section>
      )}

      {back}
    </div>
  );
}
