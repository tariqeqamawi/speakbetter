import Image from "next/image";
import type { Level } from "@/lib/store";

// The brand lion, tinted per level — yellow for Beginner through to red
// for Advanced. Once chosen it follows the student everywhere their
// level is shown, so the mark itself becomes their standing.

export const levelMeta: Record<
  Level,
  { label: string; feeling: string; detail: string; accentClass: string }
> = {
  beginner: {
    label: "Beginner",
    feeling: "Nervous and shy",
    detail:
      "Focused feedback — just the two or three things that matter most right now.",
    accentClass: "text-storytelling",
  },
  intermediate: {
    label: "Intermediate",
    feeling: "Fairly confident",
    detail:
      "The same focused feedback, plus the full set of coach notes whenever you want them.",
    accentClass: "text-figurative",
  },
  advanced: {
    label: "Advanced",
    feeling: "Very confident — give me a stage",
    detail:
      "The hardest thresholds. Near full-spectrum talks are the bar.",
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
