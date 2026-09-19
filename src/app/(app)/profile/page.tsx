"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { challenges, storyPhases } from "@/data/challenges";
import { categories } from "@/data/categories";
import { lessons } from "@/data/lessons";
import { SpectrumSignature } from "@/components/spectrum-signature";
import { StreakCalendar } from "@/components/streak-calendar";
import { BadgeCollection } from "@/components/badge-collection";
import { DashboardHeader, DashboardHeaderCompact } from "@/components/dashboard-header";
import { lessonMinutes } from "@/lib/progress";
import { listAllVideos, type StoredVideoMeta } from "@/lib/attempt-videos";
import { useEffect, useState } from "react";
import { SpectrumStrip } from "@/components/spectrum";
import { useChallengeComplete } from "@/components/story-progress";
import { CategoryIcon } from "@/components/category-icons";
import { SectionBanner } from "@/components/section-banner";
import {
  ChallengesIcon,
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

export default function DashboardPage() {
  const { state, ready, attemptsFor } = useStore();
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
        right={
          <span className="text-xs tabular-nums text-ink-faint">
            {completed} of {challenges.length}
          </span>
        }
      />
      <div className="flex flex-col gap-4 p-5">
      {/* What's been done, in figures a student feels: tried, passed,
          and minutes actually spent speaking to a lens. */}
      <div className="grid grid-cols-3 gap-2">
        <Stat value={attempted} label="attempted" />
        <Stat value={completed} label="complete" accent="text-mindset" />
        <Stat value={spokenMinutes} label={spokenMinutes === 1 ? "minute spoken" : "minutes spoken"} accent="text-structure" />
      </div>
      {spokenMinutes > 0 && (
        <p className="text-sm text-ink-muted">
          <b className="font-semibold tabular-nums text-ink">{spokenMinutes} {spokenMinutes === 1 ? "minute" : "minutes"}</b> of speaking
          practiced and uploaded. Well done - every minute in front of the lens counts.
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {storyPhases.map((phase) => {
          const inPhase = challenges.filter((c) => c.phase === phase.id);
          const done = inPhase.filter((c) => isComplete(c.slug)).length;
          return (
            <li key={phase.id} className="flex items-center gap-3">
              <span className="w-4 text-xs font-bold text-ink">
                {phase.id}
              </span>
              <span className="flex-1 truncate text-xs text-ink-muted">
                {phase.name}
              </span>
              <span
                className={`h-2 w-24 overflow-hidden rounded-full ${phase.tintClass}`}
              >
                <span
                  className={`block h-full rounded-full ${phase.bgClass} ${phase.textClass} ${
                    done > 0 ? "shadow-[0_0_8px_currentColor]" : ""
                  }`}
                  style={{ width: `${(done / inPhase.length) * 100}%` }}
                />
              </span>
              <span className="w-8 text-right text-xs tabular-nums text-ink-faint">
                {done}/{inPhase.length}
              </span>
            </li>
          );
        })}
      </ul>
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
        image="/sections/lessons.jpg"
        title="Lessons"
        Icon={SkillsIcon}
        accentClass="text-storytelling"
        large
        right={
          <span className="text-xs tabular-nums text-ink-faint">
            {watched} of {lessons.length}
          </span>
        }
      />
      <div className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-2 gap-2">
        <Stat value={watched} label="lessons watched" accent="text-storytelling" />
        <Stat value={watchedMinutes} label={watchedMinutes === 1 ? "minute watched" : "minutes watched"} />
      </div>
      <ul className="flex flex-col gap-3">
        {categories.map((cat) => {
          const inCat = lessons.filter((l) => l.category === cat.id);
          const seen = inCat.filter((l) =>
            state.watchedLessons.includes(l.vimeoId),
          ).length;
          return (
            <li key={cat.id} className="flex flex-col gap-1.5">
              <span className="flex items-center gap-3">
                <CategoryIcon
                  category={cat.id}
                  className={`size-4 shrink-0 ${cat.textClass}`}
                />
                <span className="flex-1 truncate text-xs text-ink-muted">
                  {cat.short}
                </span>
                <span className="h-2 w-20 overflow-hidden rounded-full bg-navy-900">
                  <span
                    className={`block h-full rounded-full ${cat.bgClass}`}
                    style={{ width: `${(seen / inCat.length) * 100}%` }}
                  />
                </span>
                <span className="w-10 text-right text-xs tabular-nums text-ink-faint">
                  {seen}/{inCat.length}
                </span>
              </span>
              {/* The section's lessons as a strip of stills - not
                  links, a look at what's in there. Watched ones in
                  full color, the rest dimmed until they are. */}
              <span className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {inCat.map((l) => {
                  const done = state.watchedLessons.includes(l.vimeoId);
                  return (
                    <span
                      key={l.vimeoId}
                      title={l.title}
                      className={`relative aspect-video w-16 shrink-0 overflow-hidden rounded-md bg-navy-900 ring-1 ${
                        done ? `ring-current ${cat.textClass}` : "ring-navy-600"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/thumbs/${l.vimeoId}.jpg`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`size-full object-cover ${done ? "" : "opacity-45 saturate-50"}`}
                      />
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

  const attemptsPanel = state.attempts.length > 0 && (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
        Recent attempts
      </h2>
      <ul className="flex flex-col gap-2">
        {[...state.attempts]
          .reverse()
          .slice(0, 8)
          .map((attempt) => {
            const challenge = challenges.find(
              (c) => c.slug === attempt.challengeSlug,
            );
            const tries = attemptsFor(attempt.challengeSlug).length;
            const poster = posters.get(attempt.id);
            return (
              <li key={attempt.id}>
                <Link
                  href={`/challenges/${attempt.challengeSlug}`}
                  className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5 transition-colors hover:bg-navy-700"
                >
                  {/* A frame of the recording, from this device's own
                      copy - nothing is stored by us - where one is kept. */}
                  <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-navy-950 ring-1 ring-navy-600">
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-ink-faint">
                        <FilmIcon className="size-4" />
                      </span>
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink">
                    {challenge?.title ?? attempt.challengeSlug}
                    <span className="ml-2 text-xs font-normal text-ink-faint">
                      {tries > 1 ? `${tries} attempts` : "1 attempt"}
                    </span>
                  </span>
                  <span className="hidden w-32 sm:block">
                    <SpectrumStrip spectrum={attempt.spectrum} />
                  </span>
                  <span className="w-10 text-right text-sm font-bold tabular-nums text-ink">
                    {attempt.score}
                  </span>
                </Link>
              </li>
            );
          })}
      </ul>
    </section>
  );

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
      name: "Lessons",
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
      name: "Badges",
      Icon: MedalIcon,
      accentClass: "text-mindset",
      content: badgesPanel,
    },
    ...(attemptsPanel
      ? [
          {
            id: "attempts",
            name: "Attempts",
            Icon: FilmIcon,
            accentClass: "text-figurative",
            content: attemptsPanel,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6 py-6">
      {phone ? (
        <DashboardPanel sections={sections} you={{ compact: <DashboardHeaderCompact />, content: headerPanel }} />
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
          {attemptsPanel}
        </>
      )}
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
