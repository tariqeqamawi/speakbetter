"use client";

import { categories, categoryById, type CategoryId } from "@/data/categories";
import { SectionBanner } from "@/components/section-banner";
import { SpectrumBars } from "@/components/spectrum";
import { LessonLink } from "@/components/practice-panel";
import { TalkingLion, type SpokenCue } from "@/components/talking-lion";
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
} from "@/components/icons";

// The coaching mechanic, played out on the landing page. A visitor
// otherwise can't see what they're buying until they've paid, onboarded
// and uploaded - so this runs a sample review end to end: the coach
// watches, the colors light up, the notes land, and the lion says it
// out loud.
//
// Clearly labelled as a sample. Nothing here is presented as real
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
  image,
  title,
  Icon,
  accentClass,
  children,
}: {
  image: string;
  title: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-900/40">
      <SectionBanner image={image} title={title} Icon={Icon} accentClass={accentClass} />
      <div className="p-4">{children}</div>
    </section>
  );
}

export function CoachDemo() {
  const lit = categories.filter((c) => SAMPLE_SPECTRUM[c.id] >= 40).length;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-navy-600 bg-navy-800 p-5 shadow-[0_0_80px_-40px_var(--color-advanced)] sm:p-8">
      {/* the coach, large - the feature of the page */}
      <div className="flex flex-col items-center gap-3">
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

        <DemoSection image="/sections/challenges.jpg" title="What worked" Icon={CheckCircleIcon} accentClass="text-mindset">
          <ul className="flex flex-col gap-3">
            {SAMPLE_WORKED.map((n) => (
              <li key={n.note} className="flex items-start gap-2 text-sm text-ink">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${categoryById.get(n.category)?.bgClass ?? ""}`} />
                <span className="flex flex-col gap-1.5">
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

        <DemoSection image="/sections/spectrum.jpg" title={`Your color spectrum - ${lit} of 7 lit up`} Icon={SpectrumIcon} accentClass="text-body-language">
          <SpectrumBars spectrum={SAMPLE_SPECTRUM} required={["storytelling", "mindset"]} />
        </DemoSection>

        <DemoSection image="/sections/lessons.jpg" title="The lessons this challenge asked for" Icon={SkillsIcon} accentClass="text-storytelling">
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

        <DemoSection image="/sections/streak.jpg" title="For next time - do more of this" Icon={TrendingUpIcon} accentClass="text-structure">
          <ul className="flex flex-col gap-3">
            {SAMPLE_NOTES.map((n) => (
              <li key={n.category} className="flex items-start gap-2 text-sm text-ink">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${categoryById.get(n.category)?.bgClass ?? ""}`} />
                <span className="flex flex-col gap-1.5">
                  {n.note}
                  <LessonLink lesson={n.lesson} href="#pricing" />
                </span>
              </li>
            ))}
          </ul>
        </DemoSection>

        <div className="rounded-xl border border-mindset/40 bg-mindset/10 p-4">
          <p className="text-sm font-semibold text-mindset">Congratulations - you&apos;ve passed this challenge.</p>
          <p className="mt-1 text-sm text-ink-muted">The next one is waiting on the map. A better take on this one is worth more XP.</p>
        </div>
      </div>
    </div>
  );
}
