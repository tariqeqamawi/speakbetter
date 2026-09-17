import { challenges, type Challenge } from "@/data/challenges";
import { categories, type CategoryId } from "@/data/categories";

// Where the other students are on the road.
//
// INTEGRATION SWAP POINT (master plan §12, stack §19): this is a sample
// crowd. With Supabase, `presence()` reads two things - each student's
// current challenge (the first they haven't passed) and the last few
// attempts on each - and the shape returned here is the shape that
// query will return, so the panel that draws it doesn't change.
//
// The sample is deterministic per day: the same crowd all day, a
// different crowd tomorrow, so it reads as a living room rather than a
// slot machine, and so screenshots agree with each other. It leans the
// way a real cohort leans - most people early on the road, a long tail
// further along - because a crowd that's evenly spread over 24
// challenges is a crowd nobody believes.

export interface StudentOnChallenge {
  name: string;
  /** Minutes ago they uploaded an attempt at it, if they have recently. */
  uploadedMinutesAgo?: number;
  passed?: boolean;
}

export interface ChallengePresence {
  slug: string;
  /** How many students are on this challenge right now. */
  count: number;
  /** Those who uploaded an attempt recently, most recent first. */
  recent: StudentOnChallenge[];
}

const NAMES = [
  "Maya", "Jonas", "Priya", "Leo", "Amara", "Danil", "Sofia", "Ken", "Ines",
  "Tomas", "Lena", "Ravi", "Julia", "Omar", "Elsa", "Marco", "Noor", "Felix",
  "Aiko", "Sam", "Zara", "Mateo", "Hana", "Isla", "Yusuf", "Chloe", "Arjun",
  "Nadia", "Theo", "Bea", "Kwame", "Mila", "Oscar", "Rosa", "Eli", "Anya",
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The crowd today, one entry per recordable challenge, in road order. */
export function presence(now = new Date()): ChallengePresence[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  const rand = mulberry32(day * 7919);
  const road: Challenge[] = challenges.filter((c) => !c.passive);
  const names = [...NAMES].sort(() => rand() - 0.5);
  let cursor = 0;

  return road.map((c, i) => {
    // A long tail: the first few challenges hold a crowd, the last few
    // a handful. Never zero - an empty room is worse than no room.
    const weight = Math.exp(-i / 7);
    const count = Math.max(2, Math.round(3 + weight * 26 + rand() * 4));
    const recentCount = Math.min(count, Math.max(1, Math.round(1 + weight * 3 + rand() * 1.5)));
    const recent: StudentOnChallenge[] = [];
    for (let k = 0; k < recentCount; k++) {
      const name = names[cursor++ % names.length];
      recent.push({
        name,
        uploadedMinutesAgo: Math.round(4 + rand() * 60 * (6 + k * 8)),
        passed: rand() < 0.55,
      });
    }
    recent.sort((a, b) => (a.uploadedMinutesAgo ?? 0) - (b.uploadedMinutesAgo ?? 0));
    return { slug: c.slug, count, recent };
  });
}

/** "12 min ago", "3 h ago", "yesterday". */
export function ago(minutes: number): string {
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  return minutes < 60 * 48 ? "yesterday" : `${Math.round(minutes / 60 / 24)} days ago`;
}

// ── Before-and-afters other students have shared ─────────────────────
//
// Same swap point as above: with Supabase these are the rows the
// student's own shareReel() writes, read back for everyone. The sample
// gives the feed a shape before anyone's posted to it.

export interface SharedProgress {
  name: string;
  daysAgo: number;
  passed: number;
  thenScore: number;
  nowScore: number;
  thenSpectrum: Record<CategoryId, number>;
  nowSpectrum: Record<CategoryId, number>;
}

function spectrumWith(rand: () => number, lit: number): Record<CategoryId, number> {
  const ids = categories.map((c) => c.id);
  const on = new Set([...ids].sort(() => rand() - 0.5).slice(0, lit));
  const out = {} as Record<CategoryId, number>;
  for (const id of ids)
    out[id] = on.has(id) ? 45 + Math.round(rand() * 45) : 5 + Math.round(rand() * 30);
  return out;
}

export function sampleShares(now = new Date()): SharedProgress[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  const rand = mulberry32(day * 104729 + 7);
  const names = [...NAMES].sort(() => rand() - 0.5).slice(0, 6);
  return names.map((name, i) => {
    const thenScore = 42 + Math.round(rand() * 22);
    const nowScore = Math.min(97, thenScore + 12 + Math.round(rand() * 26));
    return {
      name,
      daysAgo: i === 0 ? 0 : Math.round(1 + rand() * 12 * i),
      passed: 10 + Math.round(rand() * 13),
      thenScore,
      nowScore,
      thenSpectrum: spectrumWith(rand, 2 + Math.round(rand())),
      nowSpectrum: spectrumWith(rand, 4 + Math.round(rand() * 3)),
    };
  });
}
