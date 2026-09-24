"use client";

import Link from "next/link";
import { ProgressFile } from "@/components/progress-file";
import { useStore } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { categories } from "@/data/categories";
import { lessons } from "@/data/lessons";
import { SpectrumSignature } from "@/components/spectrum-signature";
import { StreakCalendar } from "@/components/streak-calendar";
import { BadgeCollection } from "@/components/badge-collection";
import { DashboardHeader, DashboardHeaderCompact } from "@/components/dashboard-header";
import { lessonMinutes } from "@/lib/progress";
import { listAllVideos, type StoredVideoMeta } from "@/lib/attempt-videos";
import { useEffect, useState } from "react";
import { useChallengeComplete } from "@/components/story-progress";
import { CategoryIcon } from "@/components/category-icons";
import { JourneyPhases } from "@/components/journey-phases";
import { SpeakingTime } from "@/components/speaking-time";
import { SectionBanner } from "@/components/section-banner";
import {
  ChallengesIcon,
  ChevronDownIcon,
  CheckIcon,
  FilmIcon,
  FlameIcon,
  MedalIcon,
  SkillsIcon,
  SpectrumIcon,
} from "@/components/icons";
import {
  DashboardPanel,
  useIsPhone,
  type DashboardSection,
} from "@/components/dashboard-sections";

// The student's dashboard: where they stand, what they've earned, what
// they're made of, and the only place the level is changed (master plan
// §09 - movement between levels is always manual).
//
// It's built as a heads-up display rather than a settings page. Every
// panel is a view of real work: the rank comes from what they did, the
// signature from what they recorded, the calendar from the days they
// showed up. Nothing here flatters a student who hasn't practiced.
//
// Which is also why a phone gets the panels nested behind a rail rather
// than stacked four screens deep - a heads-up display you have to scroll
// isn't one. See dashboard-sections.tsx. The panels themselves are built
// once, here, and placed by whichever layout is on.

/** A panel's way out to the section it is about. The dashboard is a
 *  read-out, and every read-out should have a door: a student looking
 *  at how many lessons they have watched is one tap from watching
 *  another, at the top of the panel rather than only at the bottom. */
function JumpTo({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="grid size-7 shrink-0 place-items-center rounded-full border border-navy-600 text-ink-faint transition-colors hover:border-ink-faint hover:text-ink"
    >
      <ChevronDownIcon className="size-3.5 -rotate-90" />
    </Link>
  );
}

export default function DashboardPage() {
  const { state, ready } = useStore();
  const isComplete = useChallengeComplete();
  const phone = useIsPhone();
  const posters = useAttemptPosters();

  if (!ready) return null;

  const completed = challenges.filter((c) => isComplete(c.slug)).length;
  const attempted = new Set(state.attempts.map((a) => a.challengeSlug)).size;
  const spokenSeconds = state.attempts.reduce((sum, a) => sum + (a.durationSec || 0), 0);
  const spokenMinutes = Math.round(spokenSeconds / 60);
  const watched = state.watchedLessons.length;
  const watchedMinutes = Math.round(
    state.watchedLessons.reduce((sum, id) => sum + lessonMinutes(id), 0),
  );

  const challengesPanel = (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner
        image="/sections/challenges.jpg"
        title="Challenges"
        Icon={ChallengesIcon}
        accentClass="text-structure"
        large
        afterTitle={<JumpTo href="/challenges" label="Go to Challenges" />}
        right={
          <span className="text-xs tabular-nums text-ink-faint">
            {completed} of {challenges.length}
          </span>
        }
      />
      <div className="flex flex-col gap-6 p-5">
      {/* The minutes are the headline: of the three figures it is the
          one that is purely theirs - a score is a judgement and a count
          of passes is a gate, but time spent speaking is just what they
          did. See speaking-time.tsx. */}
      <SpeakingTime minutes={spokenMinutes} />

      <div className="grid grid-cols-2 gap-2">
        <Stat value={attempted} label="attempted" />
        <Stat value={completed} label="complete" accent="text-mindset" />
      </div>
      {/* The journey: five letters that always read S T O R Y, and the
          challenges of whichever one is open, named and described.
          journey-phases.tsx says why. */}
      <JourneyPhases state={state} isComplete={isComplete} />

      {/* Your attempts and reviews - what used to be its own dashboard
          tab. A take belongs beside the challenges it was for: the
          frame this device still holds, and the review it earned. */}
      {state.attempts.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
            Your attempts and reviews
          </span>
          <ul className="flex flex-col gap-2">
            {[...state.attempts]
              .sort((a, b) => (a.at < b.at ? 1 : -1))
              .slice(0, 6)
              .map((attempt) => {
                const challenge = challenges.find((c) => c.slug === attempt.challengeSlug);
                const poster = posters.get(attempt.id);
                return (
                  <li key={attempt.id}>
                    <Link
                      href={`/review/${attempt.id}`}
                      className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-900/60 p-2 transition-colors hover:border-ink-faint"
                    >
                      <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-navy-950 ring-1 ring-navy-600">
                        {poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={poster} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-ink-faint">
                            <FilmIcon className="size-4" />
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-ink">
                          {challenge?.title ?? attempt.challengeSlug}
                        </span>
                        <span className="text-[0.65rem] text-ink-faint">
                          {new Date(attempt.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })} ·{" "}
                          <span className={attempt.passed ? "text-mindset" : "text-storytelling"}>
                            {attempt.passed ? "passed" : "didn't pass"}
                          </span>{" "}
                          · Coach&apos;s review →
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-base font-bold tabular-nums text-ink">
                        {attempt.score}
                        <span className="text-[0.6rem] font-medium text-ink-faint">/100</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
      <Link
        href="/challenges"
        className="self-start text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        Go to challenges →
      </Link>
      </div>
    </section>
  );

  const lessonsPanel = (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner
        title="Skills"
        Icon={SkillsIcon}
        accentClass="text-storytelling"
        large
        afterTitle={<JumpTo href="/skills" label="Go to Skills" />}
        right={
          <span className="text-xs tabular-nums text-ink-faint">
            {watched} of {lessons.length}
          </span>
        }
      />
      <div className="flex flex-col gap-6 p-5">
      <div className="grid grid-cols-2 gap-2">
        <Stat value={watched} label="lessons watched" accent="text-storytelling" />
        <Stat value={watchedMinutes} label={watchedMinutes === 1 ? "minute watched" : "minutes watched"} />
      </div>
      <ul className="flex flex-col gap-5">
        {categories.map((cat) => {
          const inCat = lessons.filter((l) => l.category === cat.id);
          const seen = inCat.filter((l) =>
            state.watchedLessons.includes(l.vimeoId),
          ).length;
          return (
            <li key={cat.id} className="flex flex-col gap-2">
              <span className="flex items-center gap-2.5">
                <CategoryIcon
                  category={cat.id}
                  className={`size-4 shrink-0 ${cat.textClass}`}
                />
                <span className={`w-28 shrink-0 truncate text-xs font-medium ${cat.textClass}`}>
                  {cat.short}
                </span>
                {/* One bar, filled to the share watched - a row of
                    squares was a count nobody was counting. */}
                <span className={`h-2.5 flex-1 overflow-hidden rounded-full bg-navy-950 ring-1 ring-inset ring-navy-600 ${cat.textClass}`} aria-hidden>
                  <span
                    className={`block h-full rounded-full transition-[width] duration-500 ${cat.bgClass} ${seen > 0 ? "shadow-[0_0_8px_currentColor]" : ""}`}
                    style={{ width: `${(seen / inCat.length) * 100}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                  <b className={`font-semibold ${cat.textClass}`}>{seen}</b>/{inCat.length}
                </span>
              </span>
              {/* The color's lessons as stills: the watched ones lit
                  with a tick, the rest dark beside them - so what's done
                  and what's waiting read in the same glance. Watched
                  first, so the lit ones lead. */}
              <span className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[...inCat]
                  .sort((a, b) => {
                    const sa = state.watchedLessons.includes(a.vimeoId) ? 0 : 1;
                    const sb = state.watchedLessons.includes(b.vimeoId) ? 0 : 1;
                    return sa - sb;
                  })
                  .map((l) => {
                    const done = state.watchedLessons.includes(l.vimeoId);
                    return (
                      <span
                        key={l.vimeoId}
                        title={done ? l.title : `${l.title} - not watched yet`}
                        className={`relative aspect-video w-16 shrink-0 overflow-hidden rounded-md bg-navy-950 ${done ? "" : "ring-1 ring-inset ring-navy-600"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/thumbs/${l.vimeoId}.jpg`}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className={`size-full object-cover transition-[filter,opacity] ${done ? "" : "opacity-25 grayscale"}`}
                        />
                        {done && (
                          <span className={`absolute bottom-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-navy-950/85 ${cat.textClass}`}>
                            <CheckIcon className="size-2.5" />
                          </span>
                        )}
                      </span>
                    );
                  })}
              </span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/skills"
        className="self-start text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        Go to skills →
      </Link>
      </div>
    </section>
  );

  const signaturePanel = <SpectrumSignature state={state} />;
  const streakPanel = <StreakCalendar state={state} />;
  const badgesPanel = <BadgeCollection state={state} />;

  const headerPanel = <DashboardHeader />;

  const sections: DashboardSection[] = [
    {
      id: "challenges",
      name: "Challenges",
      Icon: ChallengesIcon,
      accentClass: "text-structure",
      content: challengesPanel,
    },
    {
      id: "lessons",
      name: "Skills",
      Icon: SkillsIcon,
      accentClass: "text-storytelling",
      content: lessonsPanel,
    },
    {
      id: "signature",
      name: "Spectrum",
      Icon: SpectrumIcon,
      accentClass: "text-body-language",
      content: signaturePanel,
    },
    {
      id: "streak",
      name: "Streak",
      Icon: FlameIcon,
      accentClass: "text-acting",
      content: streakPanel,
    },
    {
      id: "badges",
      name: "Trophies",
      Icon: MedalIcon,
      accentClass: "text-mindset",
      content: badgesPanel,
    },
  ];

  return (
    <div className="flex flex-col gap-6 py-6">
      {phone ? (
        <DashboardPanel
          sections={sections}
          you={{
            compact: (open, toggle) => <DashboardHeaderCompact open={open} onToggle={toggle} />,
            content: headerPanel,
          }}
        />
      ) : (
        <>
          {headerPanel}

          {/* Challenges and lessons, each with their own breakdown - one
              half of the row each, so they fill the width rather than
              huddling on the left of it. */}
          <div className="grid gap-4 lg:grid-cols-2">
            {challengesPanel}
            {lessonsPanel}
          </div>

          {/* Signature + streak. The spectrum is the centrepiece, so it
              takes two thirds of the row once there's width for it. */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex lg:col-span-2">{signaturePanel}</div>
            {streakPanel}
          </div>

          {badgesPanel}
        </>
      )}

      {/* Their record is theirs, and this is how they keep a copy of
          it that does not depend on us being right.
          
          Deliberately OUTSIDE the block above, which only draws once
          somebody has done something. A student whose device has just
          lost everything has no attempts, no lessons and no trophies -
          they are precisely the person who needs the Restore button,
          and hiding it behind having progress would hide it from the
          only person looking for it. */}
      <ProgressFile />
    </div>
  );
}

/** A figure and what it counts. */
function Stat({ value, label, accent = "text-ink" }: { value: number; label: string; accent?: string }) {
  return (
    <span className="flex flex-col rounded-xl border border-navy-600 bg-navy-900/60 px-3 py-2.5">
      <b className={`text-xl font-bold tabular-nums leading-tight ${accent}`}>{value}</b>
      <span className="text-[0.65rem] text-ink-faint">{label}</span>
    </span>
  );
}

/** The recordings this device still holds, newest first, with a frame each. */

/** Attempt id -> a frame of its recording, for the recordings this
 *  device still holds (the last three per challenge). */
function useAttemptPosters(): Map<string, string> {
  const [posters, setPosters] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let alive = true;
    listAllVideos().then((rows: StoredVideoMeta[]) => {
      if (!alive) return;
      setPosters(new Map(rows.filter((r) => r.poster).map((r) => [r.id, r.poster!])));
    });
    return () => {
      alive = false;
    };
  }, []);
  return posters;
}
