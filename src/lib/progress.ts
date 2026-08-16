import type { AppState } from "@/lib/store";
import { categories, type CategoryId } from "@/data/categories";
import { challenges } from "@/data/challenges";
import { badgeDefs } from "@/data/badges";

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
  challengePassed: 100,
  lessonWatched: 10,
  badge: 50,
  /** A completed three-quest day - the chest on the Today screen. */
  dailyChest: 50,
} as const;

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
  const xp =
    state.attempts.length * XP.upload +
    passedSlugs.size * XP.challengePassed +
    state.watchedLessons.length * XP.lessonWatched +
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
