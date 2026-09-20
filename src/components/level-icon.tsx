import Image from "next/image";
import type { Level } from "@/lib/store";

// The brand lion, tinted per level - yellow for Beginner through to red
// for Advanced. Once chosen it follows the student everywhere their
// level is shown, so the mark itself becomes their standing.

export const levelMeta: Record<
  Level,
  { label: string; feeling: string; detail: string; looksFor: string; accentClass: string }
> = {
  beginner: {
    label: "Beginner",
    feeling: "Nervous and shy",
    detail:
      "Focused feedback - just the two or three things that matter most right now.",
    looksFor:
      "Coach looks for the basic implementation of the lessons and skills each challenge asks for. Did you attempt them? Two or three notes, and the pass bar is within reach.",
    accentClass: "text-storytelling",
  },
  intermediate: {
    label: "Intermediate",
    feeling: "Fairly confident",
    detail:
      "The same focused feedback, plus the full set of coach notes whenever you want them.",
    looksFor:
      "You're expected to show up with more of the spectrum of speaking skills - more colours in every take, for more dynamic performances. Coach names the techniques you used without being asked, and reaches into other lessons that would lift the next take.",
    accentClass: "text-figurative",
  },
  advanced: {
    label: "Advanced",
    feeling: "Very confident - give me a stage",
    detail:
      "The hardest thresholds. Near full-spectrum talks are the bar.",
    looksFor:
      "Coach listens for nuance and detail: how you project your voice and whether it's resonant - speaking from the belly, in your dropped-in register, holding the level to the end of every line - your eye contact with the lens, whether your hand gestures accurately describe what you're saying, and whether you paint visually what you're describing in words.",
    accentClass: "text-acting",
  },
};

export function LevelIcon({
  level,
  className = "h-12 w-auto",
  priority = false,
}: {
  level: Level;
  className?: string;
  priority?: boolean;
}) {
  // The orange and red tints are much darker than the yellow one, and on
  // the navy ground they read as missing rather than dim. A saturation
  // and brightness lift brings all three up to the vivid category
  // colors they stand for, without three new assets.
  return (
    <Image
      src={`/level-${level}.png`}
      alt=""
      width={320}
      height={256}
      priority={priority}
      className={`saturate-150 brightness-125 ${className}`}
    />
  );
}
