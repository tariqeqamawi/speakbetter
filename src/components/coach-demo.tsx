"use client";

import { categories, categoryById, type CategoryId } from "@/data/categories";
import { SpectrumBars } from "@/components/spectrum";
import { LessonLink } from "@/components/practice-panel";
import { useEffect, useRef, useState } from "react";
import { TalkingLion, type SpokenCue } from "@/components/talking-lion";
import { Confetti } from "@/components/confetti";
import {
  BrushIcon,
  CheckCircleIcon,
  CheckIcon,
  FilmIcon,
  FlatlineIcon,
  HandIcon,
  SkillsIcon,
  SpectrumIcon,
  TrendingUpIcon,
  ZapIcon,
} from "@/components/icons";

// The coaching mechanic, played out on the landing page. A visitor
// otherwise can't see what they're buying until they've paid, onboarded
// and uploaded - so this runs a sample review end to end: the coach
// watches, the colors light up, the notes land, and the lion says it
// out loud.
//
// Clearly labeled as a sample. Nothing here is presented as real
// student data.

// Agrees with what the coach says: the scene and the hands worked,
// the voice stayed at one volume, a first take with room to grow.
const SAMPLE_SPECTRUM: Record<CategoryId, number> = {
  storytelling: 72,
  figurative: 34,
  acting: 41,
  structure: 58,
  mindset: 66,
  "body-language": 63,
  advanced: 22,
};

// Each note names the real lesson behind it - the same tie between
// coaching and curriculum a student gets after buying (§08). Shown as
// text, not links: the lessons live past the paywall.
const L = (vimeoId: string, title: string, category: string) => ({ vimeoId, title, category });

const SAMPLE_WORKED: { category: CategoryId; at: string; note: string; lesson: { vimeoId: string; title: string; category: string } }[] = [
  {
    category: "storytelling",
    at: "0:04",
    note: "You dropped us straight into the kitchen, no build-up - the scene, not the story - and it's why we were with you from the first line.",
    lesson: L("1081031433", "Life Scene NOT Life Story", "storytelling"),
  },
  {
    category: "body-language",
    at: "0:41",
    note: "When you described the bread your hands drew the loaf - the width, the weight - so the gesture was doing the describing with you.",
    lesson: L("1080653314", "Hand Gestures: Express Visually What You Say Verbally", "body-language"),
  },
];

const SAMPLE_LESSONS: { category: CategoryId; lesson: { vimeoId: string; title: string; category: string }; used: boolean; quality: number; evidence: string }[] = [
  {
    category: "storytelling",
    lesson: L("1081031433", "Life Scene NOT Life Story", "storytelling"),
    used: true,
    quality: 7,
    evidence: "One scene, the kitchen, from the first line to the last - not a summary of a week.",
  },
  {
    category: "mindset",
    lesson: L("1081162517", "As The Speaker You Have ALL The Power!", "mindset"),
    used: true,
    quality: 5,
    evidence: "You held the lens for the first minute; it drifted to the side during the middle third.",
  },
];

// Skills Coach spotted that nobody asked for.
//
// This section was missing from the demo, and it is the one that
// surprises people: every other part of a review tells you how you did
// at the thing you were told to do, and this one tells you what you
// did well by instinct, names the lesson behind it, and turns it from
// luck into something you can do on purpose. A demonstration of the
// coaching that leaves it out is demonstrating a marking scheme.
//
// Both of these are evidenced by lines the coach actually says in the
// spoken review above - the hands drawing the loaf, and the shirt - so
// the section agrees with the voice rather than inventing a second
// opinion.
const SAMPLE_SPOTTED: { category: CategoryId; lesson: { vimeoId: string; title: string; category: string }; at: string; quality: number; evidence: string }[] = [
  {
    category: "body-language",
    lesson: L("1080653314", "Hand Gestures: Express Visually What You Say Verbally", "body-language"),
    at: "0:41",
    quality: 8,
    evidence: "Your hands drew the width and the weight of the loaf while you described it - nobody asked for that.",
  },
  {
    category: "figurative",
    lesson: L("1081032662", "Similes: Examples & Explanation", "figurative"),
    at: "1:12",
    quality: 6,
    evidence: "“Like a brick out of the oven” - a simile, used without reaching for one.",
  },
];

const SAMPLE_NOTES: { category: CategoryId; note: string; lesson: { vimeoId: string; title: string; category: string } }[] = [
  {
    category: "acting",
    note: "The middle third stayed at one volume, and the hands went quiet right at the line that mattered. Drop to a whisper there and bring one hand back up to paint it.",
    lesson: L("1080675446", "Making Your Message a Melody", "acting"),
  },
];

// What the coach is talking about, moment by moment. The times are
// word timestamps from the clip itself (faster-whisper), in the clip's
// own time (it arrives already at the coach's pace) so each symbol
// lands on the word being spoken: the student hears "hands" and sees a
// hand. The clip is the settled voice (Charon, British, the lion's
// direction) said through /api/speak; regenerate it there if the line
// changes, and re-time these.
const CUES: SpokenCue[] = [
  {
    at: 8.4,
    until: 10.8,
    word: "Into the scene",
    colorClass: "text-storytelling",
    Icon: FilmIcon,
  },
  {
    at: 17.9,
    until: 20.6,
    word: "Hands",
    colorClass: "text-body-language",
    Icon: HandIcon,
  },
  {
    at: 23.2,
    until: 25.5,
    word: "Nice shirt",
    colorClass: "text-mindset",
    Icon: CheckCircleIcon,
    summary: false, // proof the coach watched, not something to work on
  },
  {
    at: 27.0,
    until: 28.6,
    word: "One volume",
    colorClass: "text-acting",
    Icon: FlatlineIcon,
  },
  {
    at: 34.6,
    until: 36.4,
    word: "Paint it",
    colorClass: "text-figurative",
    Icon: BrushIcon,
  },
  {
    at: 42.8,
    until: 45.9,
    word: "Passed",
    colorClass: "text-mindset",
    Icon: CheckCircleIcon,
    summary: false, // a verdict, not something to work on
  },
];

const SPOKEN =
  "Well done for getting this recorded - a full ninety seconds, standing, to a lens. That's not nothing. Two things worked. You dropped us straight into the kitchen, no build-up: that's the life-scene lesson, the scene not the story, and it's why we were with you from the first line. And when you described the bread, your hands drew the loaf - the width of it, the weight - so the gesture was doing the describing with you. Nice shirt, by the way. The blue works on camera. For next time: the middle third stayed at one volume. Your hands went quiet there too, right at the line that mattered. Drop to almost a whisper on that line, and bring one hand back up to paint it, and the rest will sound louder for it. The brief asked for one story with a beginning and an end - you had both. And that means... congratulations. You've passed this challenge.";

function DemoSection({
  title,
  Icon,
  accentClass,
  children,
}: {
  title: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  accentClass: string;
  children: React.ReactNode;
}) {
  // The same header the review wears inside: the icon in a tinted
  // ring, a large plain title, a rule in the section's color - no
  // picture competing with the data.
  const accentVar = `var(--color-${accentClass.replace("text-", "")})`;
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-900/60">
      <div className="flex items-center gap-3">
        <span
          className={`ml-4 grid size-10 shrink-0 place-items-center rounded-full border ${accentClass}`}
          style={{ borderColor: `color-mix(in oklab, ${accentVar} 45%, transparent)`, background: `color-mix(in oklab, ${accentVar} 12%, transparent)` }}
        >
          <Icon className="size-5" />
        </span>
        <h3 className="py-3.5 pl-1 text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</h3>
      </div>
      <span aria-hidden className="mx-4 h-px" style={{ background: `linear-gradient(90deg, ${accentVar}, transparent)`, opacity: 0.5 }} />
      <div className="p-4">{children}</div>
    </section>
  );
}

/**
 * The pass confetti, fired when the box comes into view.
 *
 * Not on mount: the section is most of a page down, so a burst on
 * mount is one that has finished before anybody arrives. Not on a
 * loop either - confetti that keeps going is a background pattern.
 * It fires when it is first seen and again if somebody scrolls back,
 * which is when it means anything.
 */
function PassBurst() {
  const box = useRef<HTMLSpanElement>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let showing = false;
    const io = new IntersectionObserver(
      ([e]) => {
        // Only on the way IN, so scrolling back and forth over the
        // edge of it does not stutter.
        if (e.isIntersecting && !showing) setRun((n) => n + 1);
        showing = e.isIntersecting;
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={box} aria-hidden className="pointer-events-none absolute inset-0">
      {run > 0 && <Confetti key={run} contained count={90} duration={4200} />}
    </span>
  );
}

export function CoachDemo() {
  const lit = categories.filter((c) => SAMPLE_SPECTRUM[c.id] >= 40).length;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-navy-600 bg-navy-800 p-5 shadow-[0_0_80px_-40px_var(--color-advanced)] sm:p-8">
      {/* Meet Coach.
          
          He was drawn large with no introduction, so the first time a
          visitor meets the character they would spend six weeks with,
          nothing on screen said who he was. Two lines cost almost
          nothing and turn a picture of a lion into somebody being
          introduced. */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Meet Coach</h3>
          <p className="text-sm text-ink-muted text-balance">The lion who watches all of your videos.</p>
        </div>
        <TalkingLion
          text={SPOKEN}
          audioSrc="/coach/sample-review.mp3"
          cues={CUES}
          captions
          large
        />
        <p className="max-w-lg text-center text-xs text-ink-faint">
          A sample review, spoken aloud by the coach - the words as captions,
          each skill named as it comes up. This is the voice, the lion, and the
          kind of feedback every take gets.
        </p>
      </div>

      {/* The review as the app shows it: what worked, the spectrum,
          the lessons this challenge asked for, what to do next - in
          view from the start, the way it lands after a take. */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between px-1">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mindset">
            <CheckIcon className="size-3.5" />
            Challenge complete
          </span>
          <span className="text-3xl font-bold tabular-nums text-ink">
            64
            <span className="text-base font-normal text-ink-faint">/100</span>
          </span>
        </div>

        {/* min-w-0 on the note bodies below.
            
            A flex item sizes to its content's minimum width unless
            told otherwise, and the lesson link inside each note has a
            thumbnail and a title - so the column grew past the card
            holding it and the right-hand end of every observation was
            clipped away by the card's overflow-hidden. Silently, on
            the one part of the page whose job is showing somebody
            exactly what the feedback looks like. */}
        <DemoSection title="What worked" Icon={CheckCircleIcon} accentClass="text-mindset">
          <ul className="flex flex-col gap-3">
            {SAMPLE_WORKED.map((n) => (
              <li key={n.note} className="flex items-start gap-2 text-sm text-ink">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${categoryById.get(n.category)?.bgClass ?? ""}`} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span>
                    <span className="mr-1.5 rounded bg-navy-700 px-1 py-0.5 text-[0.65rem] font-semibold tabular-nums text-ink-muted">{n.at}</span>
                    {n.note}
                  </span>
                  <LessonLink lesson={n.lesson} href="#pricing" />
                </span>
              </li>
            ))}
          </ul>
        </DemoSection>

        <DemoSection title={`Your color spectrum - ${lit} of 7 lit up`} Icon={SpectrumIcon} accentClass="text-body-language">
          <SpectrumBars spectrum={SAMPLE_SPECTRUM} required={["storytelling", "mindset"]} />
        </DemoSection>

        <DemoSection title="The lessons this challenge asked for" Icon={SkillsIcon} accentClass="text-storytelling">
          <ul className="flex flex-col gap-3">
            {SAMPLE_LESSONS.map((l) => (
              <li key={l.lesson.vimeoId} className="flex flex-col gap-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${categoryById.get(l.category)?.bgClass ?? ""}`} />
                  <span className="flex-1 font-medium text-ink">{l.lesson.title}</span>
                  <span className={`text-xs font-bold tabular-nums ${l.used ? "text-mindset" : "text-ink-faint"}`}>{l.quality}/10</span>
                </span>
                <span className="pl-4 text-xs text-ink-muted">{l.evidence}</span>
              </li>
            ))}
          </ul>
        </DemoSection>

        {/* The surprise in every review: what you did right without
            being told to. */}
        <DemoSection
          title="Skills you used without being asked"
          Icon={ZapIcon}
          accentClass="text-figurative"
        >
          <ul className="flex flex-col gap-3">
            {SAMPLE_SPOTTED.map((sp) => (
              <li key={sp.lesson.vimeoId} className="flex flex-col gap-1.5 text-sm">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`size-2 shrink-0 rounded-full ${categoryById.get(sp.category)?.bgClass ?? ""}`} />
                  <span className="min-w-0 flex-1 font-medium text-ink">{sp.lesson.title}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    <span className="rounded bg-navy-700 px-1 py-0.5 text-[0.65rem] font-semibold tabular-nums text-ink-muted">
                      {sp.at}
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${categoryById.get(sp.category)?.textClass ?? "text-ink-faint"}`}>
                      {sp.quality}/10
                    </span>
                  </span>
                </span>
                <span className="text-xs text-ink-muted">{sp.evidence}</span>
                <LessonLink lesson={sp.lesson} href="#pricing" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">
            Named at Intermediate and Advanced. A Beginner is told how many there were, and that the list is
            waiting at the next level.
          </p>
        </DemoSection>

        <DemoSection title="For next time - do more of this" Icon={TrendingUpIcon} accentClass="text-structure">
          <ul className="flex flex-col gap-3">
            {SAMPLE_NOTES.map((n) => (
              <li key={n.category} className="flex items-start gap-2 text-sm text-ink">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${categoryById.get(n.category)?.bgClass ?? ""}`} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  {n.note}
                  <LessonLink lesson={n.lesson} href="#pricing" />
                </span>
              </li>
            ))}
          </ul>
        </DemoSection>

        {/* Passing is the moment the whole page is selling, and it
            was announced in a green box the same size as the four
            sections above it.
            
            This is the app's OWN confetti - the same canvas, the same
            physics, the same seven colours, bursting from the lower
            corners and tumbling down - rather than a CSS approximation
            of it. A first pass at this used a drifting background
            pattern, which was confetti-ish and therefore worse than
            nothing: it demonstrated something quieter than the real
            thing on the one page whose job is showing what the real
            thing feels like.
            
            Contained rather than full screen. Over the whole window it
            would fire at somebody scrolling past, which mistakes a
            description of delight for delight. */}
        <div className="relative overflow-hidden rounded-xl border border-mindset/40 bg-mindset/10 p-4">
          <PassBurst />
          <p className="relative text-sm font-semibold text-mindset">
            Congratulations - you&apos;ve passed this challenge.
          </p>
          <p className="relative mt-1 text-sm text-ink-muted">
            The next one is waiting on the map. A better take on this one is worth more XP.
          </p>
        </div>
      </div>
    </div>
  );
}
