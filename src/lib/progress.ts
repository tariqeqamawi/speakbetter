import type { AppState } from "@/lib/store";
import { categories, type CategoryId } from "@/data/categories";
import { challenges, type Challenge, type PhaseId } from "@/data/challenges";
import { badgeDefs } from "@/data/badges";
import lengths from "@/data/lesson-lengths.json";

// The dashboard's numbers, derived from the record rather than stored.
//
// Every figure here is earned by something the student actually did -
// the same rule the coach lives under (§14): nothing is congratulated
// that didn't happen. Ranks and XP make progress legible at a glance,
// but they are a view of the work, never a substitute for it.

/** What each action is worth. Passing is worth the most; showing up at
 *  all is worth something, because that's the habit being built. */
export const XP = {
  upload: 25,
  badge: 50,
  /** A completed three-quest day - the chest on the Today screen. */
  dailyChest: 50,
} as const;

const lessonSeconds = lengths as Record<string, number>;

/**
 * What watching a lesson is worth.
 *
 * Scaled by how long the lesson runs, and deliberately not rounded to a
 * tidy grid: 8, 11, 12, 14 reads as this lesson's own number, where a
 * course of 10s and 15s reads as a tariff applied to a list. Across the
 * 121 lessons it lands on 14 distinct values between 8 and 22, so two
 * lessons side by side rarely pay the same.
 *
 * The floor matters more than the ceiling: the shortest lesson in the
 * course still has something to teach, and the spread stays narrow
 * enough that nobody is steered toward long lessons over useful ones.
 */
export function lessonXp(vimeoId: string): number {
  const seconds = lessonSeconds[vimeoId];
  if (!seconds) return 10;
  return Math.min(22, Math.max(8, Math.round(4 + seconds / 9)));
}

/**
 * What passing a challenge is worth - an order of magnitude above a
 * lesson, because a lesson is watched and a challenge is performed,
 * recorded, and judged.
 *
 * It climbs through the STORY phases: the same effort late in the
 * journey is being asked of someone doing harder things with it.
 */
const PHASE_XP: Record<PhaseId, number> = {
  S: 100,
  T: 125,
  O: 150,
  R: 175,
  Y: 200,
};

export function challengeXp(challenge: Challenge): number {
  // The passive item is watched rather than recorded, so it's paid
  // closer to a lesson than to a performance.
  if (challenge.passive) return 50;
  return PHASE_XP[challenge.phase];
}

export interface Rank {
  name: string;
  at: number; // XP required to hold this rank
}

/** Named for the journey, not for arbitrary tiers - each one is a thing
 *  a speaker becomes. */
export const ranks: Rank[] = [
  { name: "First Words", at: 0 },
  { name: "Finding Your Voice", at: 250 },
  { name: "Storyteller", at: 600 },
  { name: "Performer", at: 1200 },
  { name: "Orator", at: 2000 },
  { name: "Headliner", at: 3200 },
  { name: "Unforgettable", at: 5000 },
];

export interface RankStanding {
  xp: number;
  rank: Rank;
  next: Rank | null;
  /** 0–1 through the current rank; 1 when there's nothing above it. */
  progress: number;
  toNext: number;
}

export function standing(state: AppState): RankStanding {
  const passedSlugs = new Set(
    state.attempts.filter((a) => a.passed).map((a) => a.challengeSlug),
  );
  // Summed item by item rather than by multiplying counts, because a
  // lesson and a challenge are each worth what they are individually.
  const challengeTotal = challenges
    .filter((c) => passedSlugs.has(c.slug))
    .reduce((sum, c) => sum + challengeXp(c), 0);
  const lessonTotal = state.watchedLessons.reduce(
    (sum, id) => sum + lessonXp(id),
    0,
  );
  const xp =
    state.attempts.length * XP.upload +
    challengeTotal +
    lessonTotal +
    state.badges.length * XP.badge +
    state.questChests.length * XP.dailyChest;

  let index = 0;
  for (let i = 0; i < ranks.length; i++) if (xp >= ranks[i].at) index = i;
  const rank = ranks[index];
  const next = ranks[index + 1] ?? null;
  const span = next ? next.at - rank.at : 0;
  return {
    xp,
    rank,
    next,
    progress: next ? Math.min(1, (xp - rank.at) / span) : 1,
    toNext: next ? Math.max(0, next.at - xp) : 0,
  };
}

/** The share of each color across everything they've recorded - their
 *  speaking signature. A storyteller's chart runs yellow; someone
 *  leaning on one color sees it immediately. */
export function spectrumShare(
  state: AppState,
): { id: CategoryId; percent: number }[] {
  const totals = {} as Record<CategoryId, number>;
  for (const cat of categories) {
    totals[cat.id] = state.attempts.reduce(
      (sum, a) => sum + (a.spectrum[cat.id] ?? 0),
      0,
    );
  }
  const grand = categories.reduce((sum, c) => sum + totals[c.id], 0);
  if (grand === 0) return categories.map((c) => ({ id: c.id, percent: 0 }));

  // Whole numbers that still add to 100: floor everything, then hand the
  // leftover points to the largest remainders.
  const exact = categories.map((c) => ({
    id: c.id,
    value: (totals[c.id] / grand) * 100,
  }));
  const out = exact.map((e) => ({ id: e.id, percent: Math.floor(e.value) }));
  let remainder = 100 - out.reduce((sum, o) => sum + o.percent, 0);
  const order = [...exact]
    .map((e, i) => ({ i, frac: e.value - Math.floor(e.value) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    out[i].percent += 1;
    remainder -= 1;
  }
  return out;
}

/** Days practiced, most recent last (yyyy-mm-dd). Freeze-covered days
 *  count - that's the point of a freeze. */
export function practiceDays(state: AppState): Set<string> {
  return new Set([
    ...state.attempts.map((a) => a.at.slice(0, 10)),
    ...state.frozenDays,
  ]);
}

export function longestStreak(state: AppState): number {
  const days = [...practiceDays(state)].sort();
  if (days.length === 0) return 0;
  const DAY = 86_400_000;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = Math.round((Date.parse(days[i]) - Date.parse(days[i - 1])) / DAY);
    run = gap === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export const totalBadges = badgeDefs.length;
export const totalChallenges = challenges.length;
