import type { AppState } from "@/lib/store";
import { categories } from "@/data/categories";

// The daily quest card on Today: three slots, one chest. Two of three
// filled is the state the design aims for — set completion is the
// gentlest engagement lever there is, and every slot is real practice.
//
// Quests are derived from the record, never stored, so they can't drift
// from the truth. Only the opened chest persists (it carries XP).

export interface Quest {
  id: string;
  label: string;
  detail: string;
  done: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

export function dailyQuests(state: AppState): Quest[] {
  const t = today();
  const todaysAttempts = state.attempts.filter((a) => a.at.slice(0, 10) === t);
  const watchedToday = Object.values(state.watchedOn).filter(
    (d) => d === t,
  ).length;
  const bestColorsToday = todaysAttempts.reduce(
    (best, a) =>
      Math.max(
        best,
        categories.filter((c) => (a.spectrum[c.id] ?? 0) >= 40).length,
      ),
    0,
  );

  return [
    {
      id: "watch",
      label: "Watch a lesson",
      detail: "One to two minutes — pick any color.",
      done: watchedToday >= 1,
    },
    {
      id: "record",
      label: "Record an attempt",
      detail: "Any challenge, any take. Showing up is the rep.",
      done: todaysAttempts.length >= 1,
    },
    {
      id: "colors",
      label: "Light up 4 colors in one talk",
      detail: "Reach across the spectrum in a single attempt.",
      done: bestColorsToday >= 4,
    },
  ];
}

export function chestClaimedToday(state: AppState): boolean {
  return state.questChests.includes(today());
}
