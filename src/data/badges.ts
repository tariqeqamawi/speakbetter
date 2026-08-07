import type { CategoryId } from "./categories";
import { challenges, storyPhases } from "./challenges";

// Gamification layer — master plan §11. Badges recognize effort as much
// as achievement, and apply identically at every level (never gated).

// Structural view of the app state (kept local to avoid an import cycle
// with the store, which imports evaluateBadges).
interface BadgeEvalState {
  attempts: {
    challengeSlug: string;
    at: string;
    passed: boolean;
    spectrum: Record<CategoryId, number>;
  }[];
  watchedLessons: string[];
  badges: { id: string }[];
}

export interface BadgeDef {
  id: string;
  title: string;
  message: string;
  emoji: string;
  earned: (s: BadgeEvalState) => boolean;
}

export interface EarnedBadge {
  id: string;
  title: string;
  message: string;
  emoji: string;
  earnedAt: string;
}

/** Days on which the student uploaded, as yyyy-mm-dd strings, newest last */
function uploadDays(s: BadgeEvalState): string[] {
  return [...new Set(s.attempts.map((a) => a.at.slice(0, 10)))].sort();
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
    message: "Well done — you just uploaded your first video.",
    emoji: "🎬",
    earned: (s) => s.attempts.length >= 1,
  },
  {
    id: "five-uploads",
    title: "Finding Your Voice",
    message: "You've uploaded five videos now. This is how speakers are made.",
    emoji: "🎥",
    earned: (s) => s.attempts.length >= 5,
  },
  {
    id: "ten-uploads",
    title: "Serious Reps",
    message: "Ten videos uploaded. Your camera is officially your training partner.",
    emoji: "📈",
    earned: (s) => s.attempts.length >= 10,
  },
  {
    id: "practicing-machine",
    title: "Practicing Machine",
    message:
      "You are a practicing machine. You've already tried the same challenge five times. Go you — you're getting so much better.",
    emoji: "🔁",
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
    emoji: "✅",
    earned: (s) => s.attempts.some((a) => a.passed),
  },
  {
    id: "full-spectrum",
    title: "Full Spectrum",
    message:
      "Every color lit up in a single talk. That is a genuinely dynamic speaker at work.",
    emoji: "🌈",
    earned: (s) =>
      s.attempts.some((a) =>
        Object.values(a.spectrum).every((v) => v >= 40),
      ),
  },
  {
    id: "streak-3",
    title: "On a Roll",
    message: "Three days of practice in a row. Momentum looks good on you.",
    emoji: "🔥",
    earned: (s) => currentStreak(s) >= 3,
  },
  {
    id: "streak-7",
    title: "Unstoppable",
    message: "A full week of daily practice. Most people never do this once.",
    emoji: "⚡",
    earned: (s) => currentStreak(s) >= 7,
  },
  ...storyPhases.map((phase) => ({
    id: `phase-${phase.id}`,
    title: `${phase.name} — Complete`,
    message: `You've completed every challenge in ${phase.name}. On to the next phase of the journey.`,
    emoji: "🏅",
    earned: (s: BadgeEvalState) => phaseComplete(s, phase.id),
  })),
  {
    id: "journey-complete",
    title: "The Whole STORY",
    message:
      "All five phases complete. You can now produce a dynamic, full-spectrum talk on demand — because you've done it, with feedback, dozens of times.",
    emoji: "🏆",
    earned: (s) => storyPhases.every((p) => phaseComplete(s, p.id)),
  },
];

/** Returns badges newly earned by `state` that aren't already held. */
export function evaluateBadges(state: BadgeEvalState): EarnedBadge[] {
  const held = new Set(state.badges.map((b) => b.id));
  const now = new Date().toISOString();
  return badgeDefs
    .filter((def) => !held.has(def.id) && def.earned(state))
    .map(({ id, title, message, emoji }) => ({
      id,
      title,
      message,
      emoji,
      earnedAt: now,
    }));
}
