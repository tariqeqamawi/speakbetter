import type { AppState, Attempt } from "@/lib/store";
import type { CategoryId } from "@/data/categories";

// A worked-in student, for looking at the dashboard with something in
// it. Served only on /demo, from an ephemeral store — it never touches
// anyone's real progress, and nothing here is presented as real.

const day = (back: number) =>
  new Date(Date.now() - back * 86_400_000).toISOString();

const spectrum = (v: number[]): Record<CategoryId, number> => ({
  storytelling: v[0],
  figurative: v[1],
  acting: v[2],
  structure: v[3],
  mindset: v[4],
  "body-language": v[5],
  advanced: v[6],
});

const attempts: Attempt[] = [
  ["speaking-baseline", 76, [62, 30, 45, 40, 58, 50, 10]],
  ["story-without-help", 79, [86, 58, 82, 58, 68, 84, 28]],
  ["high-stakes-moment", 82, [90, 50, 78, 65, 72, 88, 20]],
  ["three-emotions", 85, [88, 60, 85, 55, 65, 80, 30]],
  ["voice-melody", 88, [94, 62, 88, 62, 74, 90, 22]],
].map(([slug, score, spec], i) => ({
  id: `demo-${i}`,
  challengeSlug: slug as string,
  at: day(4 - i),
  durationSec: 150,
  passed: true,
  score: score as number,
  spectrum: spectrum(spec as number[]),
  focus: [],
  fullNotes: [],
  summary: "",
}));

const badge = (id: string, title: string, icon: string, back: number) => ({
  id,
  title,
  message: "",
  icon,
  earnedAt: day(back),
});

export const demoState: AppState = {
  unlocked: true,
  level: "advanced",
  displayName: "Sample Student",
  intention:
    "I want to walk on stage without my hands shaking, and finally say the thing I actually mean.",
  avatar: "",
  attempts,
  watchedLessons: [
    "1081030429",
    "1081031042",
    "1081031146",
    "1081031433",
    "1081032328",
    "1080675446",
    "1081162517",
    "1080653314",
  ],
  badges: [
    badge("first-upload", "First Words", "film", 4),
    badge("five-uploads", "Finding Your Voice", "video", 0),
    badge("first-pass", "Challenge Complete", "check-circle", 4),
    badge("storyteller", "Storyteller", "film", 2),
    badge("handy", "Handy", "spectrum", 1),
    badge("oscar", "And the Oscar Goes To", "trophy", 0),
    badge("streak-3", "On a Roll", "flame", 2),
    badge("streak-5", "High Five", "flame", 0),
    badge("challenge-speaking-baseline", "The Before Shot", "medal", 4),
    badge("challenge-story-without-help", "No Net", "medal", 3),
    badge("challenge-voice-melody", "Hitmaker", "medal", 0),
  ],
  frozenDays: [],
  freezesRemaining: 2,
};
