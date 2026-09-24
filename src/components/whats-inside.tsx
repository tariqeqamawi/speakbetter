import {
  ChallengesIcon,
  ChatIcon,
  DeckIcon,
  FlameIcon,
  LeaderboardIcon,
  SkillsIcon,
  SpectrumIcon,
  TrophyIcon,
  VideoIcon,
  ZapIcon,
} from "@/components/icons";
import { CoachMark } from "@/components/coach-mark";

// What is actually in the app, as a grid.
//
// It was a column of full-width boxes, one feature each, which is the
// layout you use when you have four things and want each to feel
// important. There are eleven now, and eleven full-width boxes is not
// eleven important things - it is a scroll, and the reader stops
// somewhere in the middle having formed no impression of the whole.
//
// A grid is read differently: the eye takes in the SHAPE of it first -
// "there is a lot here, and it is organised" - and then picks out the
// two or three that matter to them personally. That is the honest
// impression to give somebody deciding whether this is worth the
// money, and it is the one a list of paragraphs cannot give.
//
// Each is a mark, two or three words, and one line. Anything that
// needs a paragraph to explain has its own section further down the
// page; this is the inventory, not the argument.

const FEATURES = [
  {
    Icon: VideoIcon,
    name: "Selfie recorder",
    line: "Your camera opens in the app with the brief and a countdown on screen.",
    color: "text-acting",
  },
  {
    Icon: null,
    name: "Interactive Coach",
    line: "The lion watches every take and answers you out loud.",
    color: "text-figurative",
  },
  {
    Icon: SpectrumIcon,
    name: "Speaking Spectrum",
    line: "Seven colors that light up as you use the skills behind them.",
    color: "text-storytelling",
  },
  {
    Icon: ChallengesIcon,
    name: "24 challenges",
    line: "The S.T.O.R.Y. adventure, five levels, every one on camera.",
    color: "text-structure",
  },
  {
    Icon: SkillsIcon,
    name: "81 skill lessons",
    line: "One to two minutes each, color-coded, dial into any of them.",
    color: "text-mindset",
  },
  {
    Icon: ZapIcon,
    name: "Unlockable XP",
    line: "Paid by score, spent on ranks, streaks and what comes next.",
    color: "text-advanced",
  },
  {
    Icon: DeckIcon,
    name: "Digital card deck",
    line: "79 cards - pull one, or deal a spread of all seven colors.",
    color: "text-figurative",
  },
  {
    Icon: FlameIcon,
    name: "Streaks",
    line: "Every day in a row pays a bigger bonus on every challenge.",
    color: "text-acting",
  },
  {
    Icon: TrophyIcon,
    name: "Trophies",
    line: "47 of them, each earned by doing one particular thing well.",
    color: "text-storytelling",
  },
  {
    Icon: LeaderboardIcon,
    name: "Leaderboards",
    line: "Three of them, because there is more than one way to get better.",
    color: "text-body-language",
  },
  {
    Icon: ChatIcon,
    name: "Community chat",
    line: "Rooms for the cohort, and a thread on every single challenge.",
    color: "text-mindset",
  },
];

export function WhatsInside() {
  return (
    <section className="flex w-full flex-col items-center gap-6">
      <h2 className="text-2xl font-semibold tracking-tight">What&apos;s in the app</h2>

      <ul className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {FEATURES.map(({ Icon, name, line, color }) => (
          <li
            key={name}
            className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800 p-4"
          >
            <span className={`flex size-9 items-center justify-center ${color}`}>
              {/* The coach is a face, not a glyph - he is the one thing
                  in this list that is a character rather than a
                  feature, and a generic icon would flatten that. */}
              {Icon ? <Icon className="size-6" /> : <CoachMark className="size-9" />}
            </span>
            <span className="text-sm font-bold leading-tight text-ink">{name}</span>
            <span className="text-xs leading-snug text-ink-muted">{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
