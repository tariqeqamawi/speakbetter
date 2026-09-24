"use client";

import { useEffect, useState } from "react";
import { challengeBySlug, storyPhases } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById } from "@/data/categories";
import { CategoryChip } from "@/components/category-chip";
import { XpBadge } from "@/components/xp-badge";
import { challengeXp } from "@/lib/progress";
import { LazyVimeoPlayer } from "@/components/lazy-vimeo-player";
import { LionMouth } from "@/components/lion-mouth";
import { CircleIcon } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";

// "The first one's on us." The first challenge, shown as it looks
// inside: the brief, the explainer, what passing takes, the lessons to
// warm up with.
//
// SHOWN, NOT RUN. It used to be live - the real recorder, the real
// review, on the sales page - and a second worked review under it. Two
// problems with that. A visitor who has decided nothing is being asked
// for their camera, which is a large request from a stranger; and the
// review it produced was the same review already demonstrated in full
// higher up the page, so the page spent its longest section repeating
// its own best argument to somebody who had already read it.
//
// What this answers now is the question a reader actually has here -
// "what would a challenge look like?" - and the answer to that is a
// picture of one. The way in is the button underneath.

const SLUG = "speaking-baseline";

export function FirstChallenge() {
  const challenge = challengeBySlug.get(SLUG)!;
  const phase = storyPhases.find((p) => p.id === challenge.phase)!;
  const warmUp = challenge.relatedLessonIds.map((id) => lessonByVimeoId.get(id)).filter((l) => l !== undefined);

  // The lion's line changes with what the visitor has done: it draws
  // breath on the way in, and speaks once there's a review to speak of.
  const [breath, setBreath] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      // a slow breath, never a word: the coach is waiting, not talking
      setBreath(0.06 + 0.05 * (0.5 + 0.5 * Math.sin((now - t0) / 900)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="try" className="scroll-mt-20 flex flex-col items-center gap-6">
      <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.35em] text-mindset">The first one&apos;s on us</span>
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Experience Speak Better</h2>
        <p className="text-lg text-ink-muted text-balance">
          Here is the first challenge, exactly as it looks inside: record yourself speaking for two minutes with no
          preparation, and Coach tells you what he saw. It is the &ldquo;before&rdquo; everything else gets measured
          against - and it is free.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start">
        {/* The coach, waiting - and what it will do. */}
        <aside className="flex flex-col items-center gap-3 rounded-2xl border border-advanced/40 bg-navy-800/70 p-5 text-center shadow-[0_0_40px_-16px_var(--color-advanced)] lg:sticky lg:top-24">
          <LionMouth level={breath} className="w-40" />
          <p className="text-sm font-medium text-ink text-balance">
            This is challenge one of twenty-four. Every one of them works like this.
          </p>
          <ul className="flex flex-col gap-1.5 text-left text-xs text-ink-muted">
            {[
              ["What you did with your hands and eyes", "text-body-language"],
              ["Which lessons you were already using", "text-storytelling"],
              ["Your score, and your seven-color spectrum", "text-mindset"],
              ["Said aloud, with the words on screen", "text-advanced"],
            ].map(([line, color]) => (
              <li key={line} className="flex items-start gap-2">
                <span className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-current ${color}`} />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-[0.65rem] text-ink-faint">
            When you join, this is the first thing you do - and the recording stays on your phone. Nobody but Coach
            ever sees it.
          </p>
        </aside>

        {/* The challenge page, as the app lays it out - and live. */}
        <div className="flex flex-col gap-5 rounded-2xl border border-navy-600 bg-navy-900 p-4 sm:p-6">
          <header className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
              {phase.id} - {phase.name} · Challenge 1 of 24
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h3 className="text-2xl font-semibold tracking-tight text-balance">{challenge.title}</h3>
              <XpBadge xp={challengeXp(challenge)} size="md" upTo className={`border border-navy-600 ${phase.textClass}`} />
            </div>
            <p className="max-w-lg text-ink-muted">{challenge.brief}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {challenge.targetSkills.map((skill) => (
                <CategoryChip key={skill} category={skill} />
              ))}
            </div>
          </header>

          {challenge.vimeoId && (
            <LazyVimeoPlayer vimeoId={challenge.vimeoId} title={challenge.title} poster={`/thumbs/${challenge.vimeoId}.jpg`} />
          )}

          <section className="rounded-xl border border-navy-600 bg-navy-800 p-4">
            <h4 className="mb-2 text-sm font-medium uppercase tracking-wider text-ink-faint">What success looks like</h4>
            <ul className="flex flex-col gap-1.5">
              {challenge.criteria.map((criterion) => (
                <li key={criterion} className="flex items-start gap-2 text-sm text-ink">
                  <CircleIcon className="mt-1 size-3.5 shrink-0 text-ink-faint" />
                  {criterion}
                </li>
              ))}
            </ul>
          </section>

          {warmUp.length > 0 && (
            <section className="flex flex-col gap-2">
              <h4 className="text-sm font-medium uppercase tracking-wider text-ink-faint">Warm up - a few minutes of skills</h4>
              <ul className="flex flex-col gap-2">
                {warmUp.map((lesson) => {
                  const cat = categoryById.get(lesson.category)!;
                  return (
                    <li key={lesson.vimeoId}>
                      <Link
                        href={`/skills/${lesson.category}/${lesson.vimeoId}?from=${challenge.slug}`}
                        className="flex min-h-11 items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm transition-colors hover:bg-navy-700"
                      >
                        <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded bg-navy-950">
                          <Image src={`/thumbs/${lesson.vimeoId}.jpg`} alt="" fill sizes="64px" className="object-cover" />
                        </span>
                        <span className={`size-2 shrink-0 rounded-full ${cat.bgClass}`} />
                        <span className="flex-1 font-medium text-ink">{lesson.title}</span>
                        <span className="text-xs text-ink-faint">free</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Not a recorder, and not a second review.
              
              The live practice panel used to be here, pinning a
              Record / Upload bar under the navigation of every screen
              a visitor scrolled through - a control for an app they
              have not bought - and asking for the camera from
              somebody who has decided nothing. Under it sat a second
              copy of the worked review that is already shown in full
              eight screens up.
              
              What belongs here is the door. */}
          <div className="flex flex-col items-center gap-2 rounded-xl border border-navy-600 bg-navy-800 p-5 text-center">
            <p className="text-sm text-ink-muted text-balance">
              Coach reviews this one free when you join - your baseline, and the first mark on the road.
            </p>
            <a href="#pricing" className="cta-neon-wrap rounded-xl">
              <span className="cta-neon-glow rounded-xl" aria-hidden />
              <span className="cta-neon block rounded-xl px-7 py-3.5 text-sm">Start with this challenge</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
