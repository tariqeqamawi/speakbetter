import type { CategoryId } from "./categories";
import { challengeBadges, challenges, storyPhases } from "./challenges";

// Gamification layer - master plan §11. Badges recognize effort as much
// as achievement, and apply identically at every level (never gated).

// Structural view of the app state (kept local to avoid an import cycle
// with the store, which imports evaluateBadges).
interface BadgeEvalState {
  attempts: {
    challengeSlug: string;
    at: string;
    passed: boolean;
    durationSec: number;
    spectrum: Record<CategoryId, number>;
  }[];
  watchedLessons: string[];
  badges: { id: string }[];
  /** Days a streak freeze covered - they count as practiced */
  frozenDays?: string[];
}

export interface BadgeDef {
  id: string;
  title: string;
  message: string;
  /** Line-icon name - the fallback, and what celebrations use inline. */
  icon: string;
  /** What to do to win it, shown on hover before it's earned. Left off
   *  deliberately on a few, which show as hidden achievements - a
   *  collection with nothing unknown in it stops being worth exploring. */
  how?: string;
  earned: (s: BadgeEvalState) => boolean;
}

export interface EarnedBadge {
  id: string;
  title: string;
  message: string;
  icon: string;
  earnedAt: string;
}

/** Days the student practiced - uploads, plus any a freeze covered */
function uploadDays(s: BadgeEvalState): string[] {
  return [
    ...new Set([
      ...s.attempts.map((a) => a.at.slice(0, 10)),
      ...(s.frozenDays ?? []),
    ]),
  ].sort();
}

/** Has the student practiced today? Drives the daily goal on Today. */
export function practicedToday(s: BadgeEvalState): boolean {
  return uploadDays(s).includes(new Date().toISOString().slice(0, 10));
}

/** Current consecutive-day upload streak ending today or yesterday */
export function currentStreak(s: BadgeEvalState): number {
  const days = uploadDays(s);
  if (days.length === 0) return 0;
  const DAY = 86_400_000;
  const today = new Date().toISOString().slice(0, 10);
  const last = days[days.length - 1];
  const gapFromToday = Math.round(
    (Date.parse(today) - Date.parse(last)) / DAY,
  );
  if (gapFromToday > 1) return 0; // streak broken
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const gap = Math.round((Date.parse(days[i]) - Date.parse(days[i - 1])) / DAY);
    if (gap === 1) streak++;
    else break;
  }
  return streak;
}

function phaseComplete(s: BadgeEvalState, phaseId: string): boolean {
  const phaseChallenges = challenges.filter((c) => c.phase === phaseId);
  return phaseChallenges.every((c) =>
    c.passive
      ? c.relatedLessonIds.every((id) => s.watchedLessons.includes(id))
      : s.attempts.some((a) => a.challengeSlug === c.slug && a.passed),
  );
}

export const badgeDefs: BadgeDef[] = [
  {
    id: "first-upload",
    title: "First Words",
    message: "Well done - you just uploaded your first video.",
    icon: "film",
    how: "Upload your first challenge video.",
    earned: (s) => s.attempts.length >= 1,
  },
  {
    id: "five-uploads",
    title: "Finding Your Voice",
    message: "You've uploaded five videos now. This is how speakers are made.",
    icon: "video",
    how: "Upload five challenge videos.",
    earned: (s) => s.attempts.length >= 5,
  },
  {
    id: "ten-uploads",
    title: "Serious Reps",
    message: "Ten videos uploaded. Your camera is officially your training partner.",
    icon: "trending-up",
    how: "Upload ten challenge videos.",
    earned: (s) => s.attempts.length >= 10,
  },
  {
    id: "practicing-machine",
    title: "Practicing Machine",
    message:
      "You are a practicing machine. You've already tried the same challenge five times. Go you - you're getting so much better.",
    icon: "repeat",
    earned: (s) => {
      const counts = new Map<string, number>();
      for (const a of s.attempts)
        counts.set(a.challengeSlug, (counts.get(a.challengeSlug) ?? 0) + 1);
      return [...counts.values()].some((n) => n >= 5);
    },
  },
  {
    id: "first-pass",
    title: "Challenge Complete",
    message: "Your first challenge passed. The journey is officially underway.",
    icon: "check-circle",
    how: "Pass any challenge.",
    earned: (s) => s.attempts.some((a) => a.passed),
  },
  {
    id: "full-spectrum",
    title: "Full Spectrum",
    message:
      "Every color lit up in a single talk. That is a genuinely dynamic speaker at work.",
    icon: "spectrum",
    earned: (s) =>
      s.attempts.some((a) =>
        Object.values(a.spectrum).every((v) => v >= 40),
      ),
  },
  {
    id: "streak-3",
    title: "On a Roll",
    message: "Three days of practice in a row. Momentum looks good on you.",
    icon: "flame",
    how: "Practice three days in a row.",
    earned: (s) => currentStreak(s) >= 3,
  },
  {
    id: "streak-7",
    title: "Unstoppable",
    message: "A full week of daily practice. Most people never do this once.",
    icon: "zap",
    how: "Practice seven days in a row.",
    earned: (s) => currentStreak(s) >= 7,
  },
  {
    id: "streak-5",
    title: "High Five",
    message: "Five days straight. This is a habit now, not an experiment.",
    icon: "flame",
    how: "Practice five days in a row.",
    earned: (s) => currentStreak(s) >= 5,
  },
  {
    id: "ten-minutes",
    title: "Ten Minutes of Fame",
    message:
      "Ten minutes of you, on camera, speaking. Most people never record one.",
    icon: "video",
    how: "Upload ten minutes of video in total.",
    earned: (s) =>
      s.attempts.reduce((sum, a) => sum + (a.durationSec ?? 0), 0) >= 600,
  },
  // Skill badges - earned off what the coach actually saw in a talk, so
  // each one is evidence of a specific thing done well, not participation.
  {
    id: "handy",
    title: "Handy",
    message:
      "Your hands did the talking too - gesture that strong is rare, and it reads on camera.",
    icon: "spectrum",
    how: "Score 70 or higher on body language in a single talk.",
    earned: (s) => s.attempts.some((a) => (a.spectrum["body-language"] ?? 0) >= 70),
  },
  {
    id: "i-see-you",
    title: "I See You",
    message:
      "Three talks holding your eye line and your presence. The camera trusts you now.",
    icon: "check-circle",
    how: "Score 60 or higher on body language in three separate talks.",
    earned: (s) =>
      s.attempts.filter((a) => (a.spectrum["body-language"] ?? 0) >= 60).length >= 3,
  },
  {
    id: "storyteller",
    title: "Storyteller",
    message: "That was a story, properly told - scene, not summary.",
    icon: "film",
    how: "Score 75 or higher on storytelling in a single talk.",
    earned: (s) => s.attempts.some((a) => (a.spectrum.storytelling ?? 0) >= 75),
  },
  {
    id: "oscar",
    title: "And the Oscar Goes To",
    message:
      "You didn't report the moment, you performed it. That's acting for speakers.",
    icon: "trophy",
    how: "Score 75 or higher on acting skills in a single talk.",
    earned: (s) => s.attempts.some((a) => (a.spectrum.acting ?? 0) >= 75),
  },
  {
    id: "twisted",
    title: "Twisted",
    message: "You set them up and turned it on them. Plot twist landed.",
    icon: "repeat",
    how: "Pass the challenge 'Add a Twist in Third-Person'.",
    earned: (s) =>
      s.attempts.some((a) => a.challengeSlug === "twist-third-person" && a.passed),
  },
  {
    id: "sensational",
    title: "Sensational",
    message:
      "Figurative, sensory, vivid - your listener saw it, not just heard it.",
    icon: "trending-up",
    how: "Score 75 or higher on figurative language in a single talk.",
    earned: (s) => s.attempts.some((a) => (a.spectrum.figurative ?? 0) >= 75),
  },
  {
    id: "composer",
    title: "Composer",
    message: "You made your message a melody. Range like that keeps a room.",
    icon: "zap",
    how: "Pass the challenge 'Play With Your Voice'.",
    earned: (s) =>
      s.attempts.some((a) => a.challengeSlug === "voice-melody" && a.passed),
  },
  // One per challenge. Passing a challenge is the single most meaningful
  // thing a student does here, so each one has its own name and art
  // rather than a generic "challenge complete".
  ...challenges.map((challenge) => {
    const meta = challengeBadges[challenge.slug];
    return {
      id: `challenge-${challenge.slug}`,
      title: meta?.title ?? challenge.title,
      message: meta?.message ?? `${challenge.title} - passed.`,
      icon: "medal",
      how: challenge.passive
        ? `Watch every lesson in "${challenge.title}".`
        : `Pass the challenge "${challenge.title}".`,
      earned: (s: BadgeEvalState) =>
        challenge.passive
          ? challenge.relatedLessonIds.every((id) =>
              s.watchedLessons.includes(id),
            )
          : s.attempts.some((a) => a.challengeSlug === challenge.slug && a.passed),
    };
  }),
  ...storyPhases.map((phase) => ({
    id: `phase-${phase.id}`,
    title: `${phase.name} - Complete`,
    message: `You've completed every challenge in ${phase.name}. On to the next phase of the journey.`,
    icon: "medal",
    how: `Complete every challenge in ${phase.name}.`,
    earned: (s: BadgeEvalState) => phaseComplete(s, phase.id),
  })),
  {
    id: "journey-complete",
    title: "The Whole STORY",
    message:
      "All five phases complete. You can now produce a dynamic, full-spectrum talk on demand - because you've done it, with feedback, dozens of times.",
    icon: "trophy",
    earned: (s) => storyPhases.every((p) => phaseComplete(s, p.id)),
  },
];

/** Returns badges newly earned by `state` that aren't already held. */
export function evaluateBadges(state: BadgeEvalState): EarnedBadge[] {
  const held = new Set(state.badges.map((b) => b.id));
  const now = new Date().toISOString();
  return badgeDefs
    .filter((def) => !held.has(def.id) && def.earned(state))
    .map(({ id, title, message, icon }) => ({
      id,
      title,
      message,
      icon,
      earnedAt: now,
    }));
}
