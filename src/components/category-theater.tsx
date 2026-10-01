"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { categories, type Category } from "@/data/categories";
import { lessonByVimeoId, type Lesson } from "@/data/lessons";
import { lessonLength, lessonXp } from "@/lib/progress";
import { XpBadge } from "@/components/xp-badge";
import { useStore } from "@/lib/store";
import { VimeoPlayer } from "@/components/vimeo-player";
import { VideoStill } from "@/components/video-still";
import { CheckIcon, ChevronDownIcon, XIcon, ZapIcon } from "@/components/icons";
import { LessonCard } from "@/components/lesson-card";
import { cardFor } from "@/data/deck";
import { LessonNotes } from "@/components/lesson-notes";
import { LessonSummary } from "@/components/lesson-summary";
import { LessonTranscript } from "@/components/lesson-transcript";
import { PlayFillIcon } from "@/components/player-icons";
import { BackLink } from "@/components/back-link";

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
  const { state, ready, markLessonWatched } = useStore();
  // The demo serves these pages under /demo; links stay inside it.
  const skillsHref = usePathname().startsWith("/demo") ? "/demo/skills" : "/skills";
  // One layout for a colour's lessons, whichever way the student came
  // in (the dial or the grid): the video big at the top, edge to edge on
  // a phone, and under it three tabs - This lesson, All lessons (a stack,
  // one under another, rather than a carousel to swipe through), and
  // Category.
  // Grid view: which of the two sections under the video is open -
  // "This lesson" or "All lessons" - or neither.
  const [panel, setPanel] = useState<"lesson" | "all" | "spread">("lesson");
  // Opened from a dealt spread (?spread=<ids>, card-deck.tsx): the page
  // is about that hand - its tabs are This lesson and Your spread, and
  // Back goes to the spread, not to Skills.
  const [spread, setSpread] = useState<string[] | null>(null);
  const [featuredId, setFeaturedId] = useState(lessons[0].vimeoId);
  // Coming back to a colour opens on the first lesson not yet watched,
  // not on lesson 1 again - settled once, the moment the record loads.
  // `resumed` keeps the "Continue" label up until they pick another.
  const [placed, setPlaced] = useState(false);
  const [resumed, setResumed] = useState(false);
  if (ready && !placed) {
    setPlaced(true);
    // (A link can ask for a lesson - ?lesson=<id>, from a dealt spread -
    // and that comes first.)
    const params = new URLSearchParams(window.location.search);
    const asked = params.get("lesson");
    const dealt = params.get("spread")?.split(",").filter((id) => lessonByVimeoId.has(id));
    if (dealt?.length) setSpread(dealt);
    const wanted = lessons.find((l) => l.vimeoId === asked);
    const firstUnwatched = lessons.find((l) => !state.watchedLessons.includes(l.vimeoId));
    if (wanted) setFeaturedId(wanted.vimeoId);
    else if (firstUnwatched && firstUnwatched.vimeoId !== lessons[0].vimeoId) {
      setFeaturedId(firstUnwatched.vimeoId);
      setResumed(true);
    }
  }
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [upNext, setUpNext] = useState(false);
  const [xpFlash, setXpFlash] = useState(false);
  // Where the featured video is, for the key-ideas panel beneath it.
  const [seconds, setSeconds] = useState(0);
  // What the featured lesson pays when it finishes - fixed the moment
  // it's selected, since it gets marked watched partway through and a
  // rewatch should play out in silence. See lesson-player.tsx.
  const [rewardFor, setRewardFor] = useState<string | null>(null);
  const [reward, setReward] = useState<number | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);
  const allRef = useRef<HTMLDivElement>(null);

  // The colour's description, open the first time a student comes into
  // this colour and folded every visit after.
  const [aboutOpen, setAboutOpen] = useState(false);
  useEffect(() => {
    const key = `sb-colour-seen-${category.id}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => {
      setAboutOpen(true);
      try {
        localStorage.setItem(key, "1");
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [category.id]);

  const featured = lessons.find((l) => l.vimeoId === featuredId) ?? lessons[0];
  const card = cardFor(featured.vimeoId);
  const index = lessons.findIndex((l) => l.vimeoId === featured.vimeoId);
  const next = lessons[index + 1];
  const router = useRouter();
  const spreadLessons = (spread ?? []).map((id) => lessonByVimeoId.get(id)).filter((l): l is Lesson => Boolean(l));
  const spreadAt = spreadLessons.findIndex((l) => l.vimeoId === featured.vimeoId);
  const spreadNext = spreadAt >= 0 ? spreadLessons[spreadAt + 1] : undefined;
  // Another lesson of the hand: on this page if it's this colour's, or
  // its own colour's page, still in the spread.
  const openFromSpread = (l: Lesson, autoplay = false) => {
    if (l.category === category.id) {
      select(l.vimeoId, autoplay);
      const url = new URL(window.location.href);
      url.searchParams.set("lesson", l.vimeoId);
      window.history.replaceState(window.history.state, "", url);
    } else router.push(`${skillsHref}/${l.category}?lesson=${l.vimeoId}&spread=${(spread ?? []).join(",")}`);
  };
  // Back to the cards, with the hand still on the table (card-deck.tsx).
  const backToSpread = () => {
    try {
      sessionStorage.setItem("sb-dealt-hand-open", "1");
    } catch {}
  };
  const watched = (id: string) => ready && state.watchedLessons.includes(id);
  const watchedCount = lessons.filter((l) => watched(l.vimeoId)).length;
  const complete = ready && watchedCount === lessons.length;
  const nextColour = categories[categories.findIndex((c) => c.id === category.id) + 1];

  // Finishing the colour while here is a moment: the strip under the bar
  // arrives with a small entrance. Arriving already finished, it's just
  // there.
  const wasComplete = useRef<boolean | null>(null);
  const [justFinished, setJustFinished] = useState(false);
  useEffect(() => {
    if (!ready) return;
    if (wasComplete.current === false && complete) setJustFinished(true);
    wasComplete.current = complete;
  }, [ready, complete]);

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
    setResumed(false);
    setSeconds(0);
    setAutoplayNext(autoplay);
    setFeaturedId(id);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // The ring in the bar is a way in: every lesson in the colour.
  const showAll = () => {
    setPanel("all");
    requestAnimationFrame(() =>
      allRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
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

      {/* THE HEADER, in one line: back to Skills, the colour, and on the
          right how many of its lessons are done and which one is playing.
          Pinned under the nav as a solid bar - edge to edge, with a rule
          and a shadow beneath it - so where you are and how far through
          you are stay on screen the whole way down the page. */}
      <header className="sticky-under-header no-glass -mx-4 -mt-3 border-b border-navy-600 bg-navy-850 px-4 py-1.5 shadow-[0_8px_18px_-10px_rgb(2_5_11/0.9)] lg:-mt-8 xl:-mx-8 xl:px-8">
        {spread ? (
          <div className="flex items-center gap-2">
            <BackLink href={`${skillsHref}/cards`} onClick={backToSpread}>
              Back to spread
            </BackLink>
            <span aria-hidden className="text-ink-faint">/</span>
            <h1 className={`min-w-0 truncate text-xl font-semibold tracking-tight ${category.textClass}`}>{category.name}</h1>
            <div className="ml-auto flex items-center gap-2.5">
              <span className="spectrum-text font-mono text-sm font-bold tabular-nums" aria-label={`Card ${spreadAt + 1} of ${spreadLessons.length} in your spread`}>
                {spreadAt + 1} / {spreadLessons.length}
              </span>
              {spreadNext && (
                <button
                  type="button"
                  onClick={() => openFromSpread(spreadNext, true)}
                  title={`Next: ${spreadNext.title}`}
                  className="flex min-h-8 items-center gap-0.5 rounded-full border border-navy-600 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-current hover:text-ink"
                >
                  Next
                  <ChevronDownIcon className="size-3.5 -rotate-90" />
                </button>
              )}
            </div>
          </div>
        ) : (
        <div className="flex items-center gap-2">
          <BackLink href={skillsHref}>Skills</BackLink>
          <span aria-hidden className="text-ink-faint">/</span>
          <h1 className="min-w-0">
            <ColourSwitcher current={category} skillsHref={skillsHref} />
          </h1>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={showAll}
              className="relative size-8 shrink-0 rounded-full transition-transform hover:scale-110"
              title={`${watchedCount} of ${lessons.length} watched - see all lessons`}
              aria-label={`${watchedCount} of ${lessons.length} watched. See all lessons`}
            >
              <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  strokeWidth="3"
                  className="stroke-navy-700 transition-[fill] duration-700"
                  fill={complete ? `var(--color-${category.id})` : "none"}
                />
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
              <span className={`absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold tabular-nums ${complete ? "text-navy-950" : "text-ink"}`}>
                {complete ? <CheckIcon className="size-4" /> : watchedCount}
              </span>
            </button>
            <span className={`font-mono text-sm tabular-nums ${category.textClass}`} aria-label={`Lesson ${index + 1} of ${lessons.length}`}>
              {String(index + 1).padStart(2, "0")} / {lessons.length}
            </span>
            {/* The next lesson, one tap away from anywhere on the page -
                after scrolling down to the notes the player is a long
                way back up. */}
            {next && (
              <button
                type="button"
                onClick={() => select(next.vimeoId, true)}
                title={`Next: ${next.title}`}
                className="flex min-h-8 items-center gap-0.5 rounded-full border border-navy-600 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-current hover:text-ink"
              >
                Next
                <ChevronDownIcon className="size-3.5 -rotate-90" />
              </button>
            )}
          </div>
        </div>
        )}
      </header>

      {/* The colour, finished: said in words under the bar, with the way
          on to the next colour - the ring filling in is the picture, this
          is the caption. */}
      {complete && (
        <div
          role="status"
          className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-current bg-navy-900/60 px-4 py-2.5 ${category.textClass} ${
            justFinished ? "coach-cue shadow-[0_0_28px_-8px_currentColor]" : ""
          }`}
        >
          <CheckIcon className="size-4 shrink-0" />
          <span className="text-sm font-semibold text-ink">
            {category.name} complete
            <span className="font-normal text-ink-muted"> - all {lessons.length} lessons watched.</span>
          </span>
          <Link
            href={nextColour ? `${skillsHref}/${nextColour.id}` : skillsHref}
            className="ml-auto flex items-center gap-0.5 text-sm font-semibold hover:underline"
          >
            {nextColour ? `Next colour: ${nextColour.name}` : "Back to all colours"}
            <ChevronDownIcon className="size-4 -rotate-90" />
          </Link>
        </div>
      )}

      {/* The stage */}
      <div ref={stageRef} className="relative flex scroll-mt-28 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {resumed && (
            <span className={`rounded-full border border-current px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${category.textClass}`}>
              Continue
            </span>
          )}
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


        </div>

        {/* Keyed by lesson so the player rebuilds cleanly on each pick.
            In grid view it runs edge to edge on a phone - the whole width
            of the screen, landscape, at the top of the page. */}
        <div className="-mx-4 sm:mx-0">
        <VimeoPlayer
          key={featured.vimeoId}
          vimeoId={featured.vimeoId}
          title={featured.title}
          autoplay={autoplayNext}
          xp={reward}
          onTime={setSeconds}
          onNext={next ? () => select(next.vimeoId, true) : undefined}
          nextTitle={next?.title}
          onEnded={() => {
            if (next) setUpNext(true);
          }}
          onWatched={() => markLessonWatched(featured.vimeoId)}
        />
        </div>

        {/* What this colour is, folded beneath the player's controls -
            its subtitle and an arrow, opening to the description. Read
            once, it no longer takes the top of the screen every visit. */}
        <details
          className="group -mt-1"
          open={aboutOpen}
          onToggle={(e) => setAboutOpen(e.currentTarget.open)}
        >
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-faint transition-colors hover:text-ink-muted [&::-webkit-details-marker]:hidden">
            {category.subtitle}
            <ChevronDownIcon className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex max-w-lg flex-col gap-1 pt-2">
            <p className="text-sm text-ink-muted">{category.blurb}</p>
            <p className="text-xs text-ink-faint">{lessons.length} lessons · one to two minutes each</p>
          </div>
        </details>

        {/* What the lesson says, under it: the key ideas keeping pace
            with the video, and the transcript for anyone who wants the
            words. Both here, rather than behind a link to another
            page - this is the page. */}
        <div ref={allRef} role="tablist" aria-label="This lesson, all lessons, or another colour" className="flex scroll-mt-28 w-full gap-1 rounded-xl border border-navy-600 bg-navy-900/60 p-1">
            <PanelTab label="This lesson" on={panel === "lesson"} category={category} onClick={() => setPanel("lesson")} />
            {spread ? (
              <PanelTab label="Your spread" on={panel === "spread"} category={category} onClick={() => setPanel("spread")} />
            ) : (
              <>
                <PanelTab label="All lessons" on={panel === "all"} category={category} onClick={() => setPanel("all")} />
                <CategoryTab current={category} skillsHref={skillsHref} />
              </>
            )}
        </div>
        <Fold open={panel === "lesson"}>
        <LessonSummary vimeoId={featured.vimeoId} />
        <LessonNotes key={`n-${featured.vimeoId}`} vimeoId={featured.vimeoId} category={category.id} seconds={seconds} />
        <LessonTranscript vimeoId={featured.vimeoId} />

        {/* The lesson's own card, face up beneath it - the fastest
            version of the skill, and the deck met where the deck is
            useful. It used to be behind a button. */}
        {card && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">This lesson&apos;s card</span>
            <LessonCard key={`c-${featured.vimeoId}`} data={card} startFlipped face="vignette" className="w-56 sm:w-64" />
            <span className="text-[0.65rem] text-ink-faint">Tap the card to turn it over</span>
          </div>
        )}
        </Fold>

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

      {/* The rail - in grid view, every lesson in the colour one under
          another, folded under the lesson until asked for. */}
      {/* Your spread: the hand's lessons, one under another, each in its
          own colour - and only those. */}
      <Fold open={panel === "spread"}>
        <ul className="flex flex-col gap-2.5">
          {spreadLessons.map((l, i) => {
            const cat = categories.find((c) => c.id === l.category);
            const current = l.vimeoId === featured.vimeoId;
            return (
              <li key={l.vimeoId} className="challenge-enter w-full" style={{ animationDelay: `${i * 45}ms` }}>
                <button
                  type="button"
                  onClick={() => openFromSpread(l)}
                  aria-current={current ? "true" : undefined}
                  className={`lift-card group flex w-full flex-row items-center gap-3 overflow-hidden rounded-xl border pr-3 text-left ${cat?.textClass ?? ""} ${
                    current ? "border-current shadow-[0_0_18px_-6px_currentColor]" : "border-navy-600 hover:border-current"
                  }`}
                >
                  <span className="relative block aspect-video w-36 shrink-0 bg-gradient-to-br from-navy-700 to-navy-900 sm:w-44">
                    {cat && <VideoStill vimeoId={l.vimeoId} accent={cat} sizes="208px" />}
                    {current && (
                      <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-navy-950 ${cat?.bgClass ?? ""}`}>
                        Playing
                      </span>
                    )}
                    {watched(l.vimeoId) && !current && (
                      <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-navy-950/85 text-mindset">
                        <CheckIcon className="size-3" />
                      </span>
                    )}
                    <span className={`absolute inset-x-0 bottom-0 h-0.5 ${cat?.bgClass ?? ""}`} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5 py-2">
                    <span className="text-[0.6rem] font-bold uppercase tracking-wider">{cat?.name}</span>
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">{l.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Fold>

      <Fold open={panel === "all"}>
      <div className="relative flex scroll-mt-28 flex-col gap-2">
        <ul className="flex flex-col gap-2.5">
          {lessons.map((lesson, i) => {
            const current = lesson.vimeoId === featured.vimeoId;
            return (
              <li
                key={lesson.vimeoId}
                className="challenge-enter w-full"
                style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
              >
                <button
                  type="button"
                  onClick={() => select(lesson.vimeoId)}
                  aria-pressed={current}
                  className={`lift-card group flex w-full overflow-hidden rounded-xl border text-left flex-row items-center gap-3 pr-3 ${category.textClass} ${
                    current
                      ? "border-current shadow-[0_0_18px_-6px_currentColor]"
                      : "border-navy-600 hover:border-current"
                  }`}
                >
                  <span className={`relative block aspect-video shrink-0 bg-gradient-to-br from-navy-700 to-navy-900 w-36 sm:w-44`}>
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
                    {/* How long it runs, so a student can tell whether it
                        fits the minute they have before they tap. */}
                    {lessonLength(lesson.vimeoId) !== undefined && (
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-navy-950/85 px-1.5 py-0.5 font-mono text-[0.6rem] tabular-nums text-ink">
                        {clock(lessonLength(lesson.vimeoId)!)}
                      </span>
                    )}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 ${category.bgClass} ${current ? "" : "opacity-40"}`}
                    />
                  </span>
                  <span className={`flex min-w-0 flex-col gap-0.5 py-2`}>
                    <span className="font-mono text-[0.6rem] tabular-nums text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={`line-clamp-2 font-medium leading-snug text-ink text-sm`}>
                      {lesson.title}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      </Fold>

      <BackToTop />
    </div>
  );
}

/** One of the two tabs under the video in grid view - lit in the
 *  colour's own colour when chosen, like Orientation's. */
function PanelTab({
  label,
  on,
  category,
  onClick,
}: {
  label: string;
  on: boolean;
  category: Category;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={onClick}
      className={`flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        on ? `${category.textClass} bg-navy-800 ring-1 ring-current` : "text-ink-faint hover:text-ink-muted"
      }`}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

/** A section under the video, shown only while its tab is open. */
function Fold({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="challenge-enter flex flex-col gap-3">{children}</div>;
}

/** Once the page is well scrolled, a small round button back to the
 *  video at the top. */
function BackToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-24 right-4 z-40 flex size-11 items-center justify-center rounded-full border border-navy-500 bg-navy-900/90 text-ink shadow-xl shadow-navy-950/70 backdrop-blur transition-all duration-300 hover:border-body-language hover:text-body-language lg:bottom-8 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ChevronDownIcon className="size-5 rotate-180" />
    </button>
  );
}

/** 83 -> "1:23". */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

/** The colour's name in the pinned bar, as a way to every other colour:
 *  a small arrow beside it says it opens. Tap it, or rest a mouse on it,
 *  and the eight drop down beneath the bar - each its dot, name and what
 *  it covers - one tap from any of them. */
function ColourSwitcher({ current, skillsHref }: { current: Category; skillsHref: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // Closed by a tap anywhere else, or Escape.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  // A mouse resting on it opens it; a finger taps.
  const hover = (on: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setOpen(on);
  };
  return (
    <div ref={box} className="relative" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-9 min-w-0 items-center gap-1 rounded-lg pr-1 text-xl font-semibold tracking-tight ${current.textClass}`}
      >
        <span className="truncate">{current.name}</span>
        <ChevronDownIcon className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Skill colours"
          // (pt-2 bridges the gap below the name, so a mouse moving down
          // into the list doesn't close it on the way.)
          className="absolute left-0 top-full z-40 pt-2"
        >
          <div className="no-glass flex w-72 flex-col overflow-hidden rounded-xl border border-navy-600 bg-navy-850 py-1.5 shadow-[0_16px_40px_-12px_rgb(2_5_11/0.95)]">
            {categories.map((c) => {
              const here = c.id === current.id;
              return (
                <Link
                  key={c.id}
                  role="menuitem"
                  href={`${skillsHref}/${c.id}`}
                  aria-current={here ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2 transition-colors hover:bg-navy-700 ${here ? "bg-navy-800" : ""}`}
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${c.bgClass}`} style={{ boxShadow: `0 0 8px var(--color-${c.id})` }} />
                  <span className={`text-sm font-semibold ${c.textClass}`}>{c.name}</span>
                  <span className="truncate text-xs text-ink-muted">{c.subtitle}</span>
                  {here && <CheckIcon className="ml-auto size-3.5 shrink-0 text-ink-muted" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** The third tab under the video: Color - plain like its neighbours,
 *  lit in the current colour only while its list is open. Press it and the eight
 *  colours drop down beneath it; slide the thumb down to one - it lights
 *  as you pass over it - and let go to go there. The skill dial's
 *  press-slide-release, as a list. A plain tap opens the list and leaves
 *  it open, for tapping a colour instead. */
function CategoryTab({ current, skillsHref }: { current: Category; skillsHref: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lit, setLit] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // Where the press began, and whether the thumb has travelled since.
  // (And whether the list was already open - a tap on an open tab closes it.)
  const pressed = useRef<{ x: number; y: number; moved: boolean; wasOpen: boolean } | null>(null);

  const colourUnder = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest("[data-colour]") as HTMLElement | null)?.dataset.colour ?? null;
  const go = (id: string) => {
    setOpen(false);
    setLit(null);
    if (id !== current.id) router.push(`${skillsHref}/${id}`);
  };

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative flex min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        // (No scrolling the page while a thumb is choosing.)
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          pressed.current = { x: e.clientX, y: e.clientY, moved: false, wasOpen: open };
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setOpen(true);
        }}
        onPointerMove={(e) => {
          const p = pressed.current;
          if (!p) return;
          if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) p.moved = true;
          if (p.moved) setLit(colourUnder(e.clientX, e.clientY));
        }}
        onPointerUp={(e) => {
          const p = pressed.current;
          pressed.current = null;
          e.currentTarget.releasePointerCapture?.(e.pointerId);
          // A tap: opens the list and leaves it open - or, if it was
          // already open, closes it.
          if (!p?.moved) {
            if (p?.wasOpen) {
              setOpen(false);
              setLit(null);
            }
            return;
          }
          const id = colourUnder(e.clientX, e.clientY);
          if (id) go(id);
          else {
            setOpen(false);
            setLit(null);
          }
        }}
        onPointerCancel={() => {
          pressed.current = null;
          setLit(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          open ? `${current.textClass} bg-navy-800 ring-1 ring-current` : "text-ink-faint hover:text-ink-muted"
        }`}
      >
        <span className="truncate">Color</span>
        <ChevronDownIcon className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" aria-label="Skill colours" className="absolute right-0 top-full z-40 pt-2">
          <div className="no-glass flex w-64 flex-col overflow-hidden rounded-xl border border-navy-600 bg-navy-850 py-1.5 shadow-[0_16px_40px_-12px_rgb(2_5_11/0.95)]">
            {categories.map((c) => {
              const here = c.id === current.id;
              const on = lit === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="menuitem"
                  data-colour={c.id}
                  aria-current={here ? "page" : undefined}
                  onClick={() => go(c.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-navy-700 ${
                    on ? "bg-navy-700" : here ? "bg-navy-800" : ""
                  }`}
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${c.bgClass} transition-transform ${on ? "scale-150" : ""}`}
                    style={{ boxShadow: `0 0 8px var(--color-${c.id})` }}
                  />
                  <span className={`text-sm font-semibold ${c.textClass}`}>{c.name}</span>
                  <span className="truncate text-xs text-ink-muted">{c.subtitle}</span>
                  {here && <CheckIcon className="ml-auto size-3.5 shrink-0 text-ink-muted" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
