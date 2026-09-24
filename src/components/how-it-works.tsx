import { TrendingUpIcon, UploadIcon, VideoIcon } from "@/components/icons";
import { PlayFillIcon } from "@/components/player-icons";
import { CoachMark } from "@/components/coach-mark";

// The whole loop, in five steps.
//
// WHY IT EARNS ITS PLACE ON A PAGE THAT IS ALREADY LONG. Everything
// else here argues that Speak Better is good. None of it answers the
// simpler question a visitor asks first - what would I actually DO? -
// and until that is answered the arguing lands on nobody. Five verbs
// in a row answer it in about four seconds, which is all the attention
// this question gets before somebody scrolls past it.
//
// Numbered, deliberately. A grid of five feature cards says "here are
// five things"; a numbered row says "here is the order", and the order
// is the point: the recording comes before the feedback, which is what
// makes this different from watching videos.
//
// The fourth step wears Coach's own face rather than an icon, because
// he is the step. A generic speech bubble there would flatten the one
// thing in the loop that no other course has.

const STEPS = [
  {
    n: 1,
    title: "Watch the challenge",
    line: "A short brief, on camera, saying exactly what this one asks of you.",
    Icon: PlayFillIcon,
    color: "text-structure",
  },
  {
    n: 2,
    title: "Record yourself speaking",
    line: "In the app, with the brief and a countdown on screen. One to two minutes.",
    Icon: VideoIcon,
    color: "text-acting",
  },
  {
    n: 3,
    title: "Upload your take for Coach",
    line: "One tap. Nobody else ever sees the video - it stays yours.",
    Icon: UploadIcon,
    color: "text-figurative",
  },
  {
    n: 4,
    title: "Receive detailed feedback",
    line: "Coach the lion watches it and talks you through what landed and what didn't.",
    Icon: null,
    color: "text-storytelling",
  },
  {
    n: 5,
    title: "Improve quickly",
    line: "Do it again, better, the same day - which is the part videos alone can never give you.",
    Icon: TrendingUpIcon,
    color: "text-mindset",
  },
];

export function HowItWorks() {
  return (
    <ol className="grid w-full max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {STEPS.map(({ n, title, line, Icon, color }) => (
        <li
          key={n}
          className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800 p-4 lg:items-center lg:text-center"
        >
          <span className="flex items-center gap-2.5 lg:flex-col lg:gap-1.5">
            <span className={`flex size-9 items-center justify-center ${color}`}>
              {Icon ? <Icon className="size-6" /> : <CoachMark className="size-9" />}
            </span>
            {/* In the step's own colour, held back. In navy-600 it
                was a shade off the card it sat on and read as a
                smudge - and the whole point of numbering these is
                that the ORDER is legible at a glance. */}
            <span className={`text-2xl font-black tabular-nums leading-none opacity-60 ${color}`}>{n}</span>
          </span>
          <span className="text-sm font-bold leading-tight text-ink">{title}</span>
          <span className="text-xs leading-snug text-ink-muted">{line}</span>
        </li>
      ))}
    </ol>
  );
}
