import { challenges } from "@/data/challenges";
import { categories, type CategoryId } from "@/data/categories";

// A made-up cohort for the admin dashboard to stand on until the real
// one arrives (supabase/training.sql). Forty students over four weeks,
// in the same shape the tables will hand back - so when the database is
// switched on, the dashboard swaps this for a query and nothing else
// changes. Seeded, so it reads the same on every load.
//
// Some patterns are planted on purpose, so each panel has something to
// find: a drop at "Say What You Love - With No Filler Words", Coach
// missing the mark on gestures, the deck loved and the trophy case
// shrugged at.

export type Rating = "spot-on" | "partly" | "off";

export interface SampleTake {
  studentNo: number;
  at: string;
  challenge: string;
  level: string;
  score: number;
  passed: boolean;
  /** Coach's read of the seven colors, 0-100 each. */
  spectrum: Record<CategoryId, number>;
  transcript: string;
  coachFocus: string;
  rating?: Rating;
  ratingNote?: string;
}

export interface SampleQuestion {
  studentNo: number;
  at: string;
  question: string;
  topic: string;
}

export interface SampleReaction {
  studentNo: number;
  feature: string;
  reaction: "love" | "dislike";
  note?: string;
}

export interface SampleUsage {
  studentNo: number;
  day: string; // YYYY-MM-DD
  area: string;
  seconds: number;
}

export interface SampleStudent {
  number: number;
  level: string;
  joined: string;
}

export interface SampleCohort {
  students: SampleStudent[];
  takes: SampleTake[];
  questions: SampleQuestion[];
  reactions: SampleReaction[];
  usage: SampleUsage[];
  days: string[];
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRANSCRIPTS = [
  "So, um, the thing I love most is cooking for my family on Sundays, because it's the one time we're all at the table…",
  "My name is [name] and I've always been nervous on camera. Today I want to tell you about the day I nearly quit my job…",
  "Picture a tiny apartment in the middle of winter, the heating's broken, and I'm about to give the most important pitch of my life…",
  "I think, like, the main reason I started running was, you know, to clear my head, and it kind of became everything…",
  "Three years ago I couldn't order coffee without rehearsing it. Now I'm standing here talking to a camera, which is wild…",
  "What I'd want you to take away is simple: slow down. Say less, and let the pause do the work…",
  "Okay so this is take four, and I'm going to try to keep my hands still this time and just talk to you like a friend…",
];

const FOCUS = [
  "Slow down in the first ten seconds - the opening is rushed.",
  "Great eye contact. Next: drop the filler 'so' at the start of sentences.",
  "Use a pause before the key line so it lands.",
  "Your energy dips in the middle - vary your pace.",
  "Lovely story shape. Add one specific sensory detail.",
  "Watch the upward inflection at the end of statements.",
];

const MISSES = [
  "He didn't notice I was using my hands the whole time",
  "Said I rushed but I was deliberately fast for energy",
  "Didn't mention my gestures at all",
  "Counted 'like' as filler when I was quoting someone",
  "Missed that my ending was a callback to the start",
  "The score felt low for how it went",
  "Ignored my facial expressions",
];

const QUESTIONS: [string, string][] = [
  ["How do I stop saying um?", "Filler words"],
  ["What do I do with my hands?", "Gestures"],
  ["How do I stop my voice shaking?", "Nerves"],
  ["Is it okay to read from notes?", "Preparation"],
  ["How long should a pause be?", "Pausing"],
  ["How do I end a talk well?", "Structure"],
  ["Why do I speed up when I'm nervous?", "Nerves"],
  ["How do I sound more confident on Zoom?", "Presence"],
  ["What's a good hook for a story?", "Structure"],
  ["How do I look at the camera and not the screen?", "Eye contact"],
  ["Where should my hands be when I'm not gesturing?", "Gestures"],
  ["How do I get rid of 'like'?", "Filler words"],
];

const REACTION_NOTES: Record<string, string[]> = {
  road: ["The 3D road makes my phone hot", "Wish I could see what's next without scrolling"],
  dial: ["Took me a while to realise I could spin it"],
  deck: [],
  dashboard: ["Too much on one screen", "I only look at the streak"],
  trophies: ["Don't really care about trophies", "Would rather see my progress than trophies"],
  "ask-coach": ["Answers are a bit long", "I want to type, not talk"],
};

const FEATURE_LOVE: Record<string, number> = {
  road: 0.72,
  dial: 0.7,
  deck: 0.9,
  dashboard: 0.62,
  trophies: 0.45,
  "ask-coach": 0.8,
};

const AREAS: [string, number][] = [
  ["today", 90],
  ["road", 140],
  ["challenge", 420],
  ["review", 180],
  ["dial", 120],
  ["lesson", 260],
  ["deck", 150],
  ["ask-coach", 110],
  ["dashboard", 70],
  ["live", 30],
  ["community", 25],
];

const DAY = 86400000;

// How fast each color grows with practice, relative to the others: the
// story colors move quickest, Advanced slowest - as they should.
const GROWTH: Record<CategoryId, number> = {
  storytelling: 1.5,
  figurative: 1.2,
  acting: 1.1,
  structure: 1.3,
  mindset: 1.6,
  "body-language": 1.0,
  advanced: 0.6,
};
const START: Record<CategoryId, number> = {
  storytelling: -2,
  figurative: -14,
  acting: -10,
  structure: -6,
  mindset: -4,
  "body-language": -8,
  advanced: -30,
};

export function sampleCohort(now = Date.UTC(2026, 9, 24)): SampleCohort {
  const r = rng(40);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const start = now - 27 * DAY;
  const days = Array.from({ length: 28 }, (_, i) => new Date(start + i * DAY).toISOString().slice(0, 10));
  const road = challenges.map((c) => c.slug);

  const students: SampleStudent[] = [];
  const takes: SampleTake[] = [];
  const questions: SampleQuestion[] = [];
  const reactions: SampleReaction[] = [];
  const usage: SampleUsage[] = [];

  for (let n = 1; n <= 40; n++) {
    const level = r() < 0.55 ? "beginner" : r() < 0.75 ? "intermediate" : "advanced";
    const joinedDay = Math.floor(r() * 4);
    const drive = 0.35 + r() * 0.65;
    students.push({ number: n, level, joined: days[joinedDay] });

    // Along the road, one challenge at a time, until they stop.
    let day = joinedDay;
    let skill = 45 + r() * 20 + (level === "advanced" ? 12 : level === "intermediate" ? 6 : 0);
    let lastActive = joinedDay;
    let taken = 0;
    const base = Object.fromEntries(categories.map((c) => [c.id, START[c.id] + (r() - 0.5) * 16])) as Record<CategoryId, number>;
    for (let i = 0; i < road.length && day < days.length; i++) {
      const slug = road[i];
      const hard = slug === "no-filler-words";
      const tries = 1 + (hard ? 1 : 0) + (r() < 0.3 ? 1 : 0);
      for (let t = 0; t < tries && day < days.length; t++) {
        skill = Math.min(97, skill + r() * 3.5);
        const score = Math.round(Math.max(20, Math.min(99, skill - (hard ? 14 : 0) + (r() - 0.5) * 14)));
        // Coach misses gestures: challenges about the body are rated worse.
        const body = /body|hands|gesture|presence/i.test(slug) || i % 7 === 4;
        const rated = r() < 0.7;
        const roll = r();
        const rating: Rating | undefined = !rated
          ? undefined
          : roll < (body ? 0.42 : 0.68)
            ? "spot-on"
            : roll < (body ? 0.72 : 0.9)
              ? "partly"
              : "off";
        takes.push({
          studentNo: n,
          at: new Date(start + day * DAY + r() * DAY * 0.9).toISOString(),
          challenge: slug,
          level,
          score,
          passed: score >= 60,
          spectrum: Object.fromEntries(
            categories.map((c) => [
              c.id,
              Math.round(Math.max(5, Math.min(99, skill + base[c.id] + GROWTH[c.id] * taken * 1.4 + (r() - 0.5) * 10))),
            ]),
          ) as Record<CategoryId, number>,
          transcript: pick(TRANSCRIPTS),
          coachFocus: pick(FOCUS),
          rating,
          ratingNote: rating && rating !== "spot-on" && r() < 0.6 ? pick(MISSES) : undefined,
        });
        lastActive = day;
        taken++;
        day += r() < 0.7 ? 1 : 2;
      }
      const stay = hard ? 0.72 * drive + 0.1 : 0.9 * drive + 0.1;
      if (r() > stay) break;
    }

    for (let q = 0, k = Math.floor(r() * 5 * drive); q < k; q++) {
      const [question, topic] = pick(QUESTIONS);
      const d = joinedDay + Math.floor(r() * (lastActive - joinedDay + 1));
      questions.push({ studentNo: n, at: new Date(start + d * DAY + r() * DAY).toISOString(), question, topic });
    }

    for (const feature of Object.keys(FEATURE_LOVE)) {
      if (r() > 0.55) continue;
      const love = r() < FEATURE_LOVE[feature];
      const notes = REACTION_NOTES[feature];
      reactions.push({
        studentNo: n,
        feature,
        reaction: love ? "love" : "dislike",
        note: !love && notes.length && r() < 0.6 ? pick(notes) : undefined,
      });
    }

    for (let d = joinedDay; d <= Math.min(lastActive + 1, days.length - 1); d++) {
      if (r() > 0.55 + drive * 0.4) continue;
      for (const [area, mean] of AREAS) {
        if (r() > 0.6) continue;
        usage.push({ studentNo: n, day: days[d], area, seconds: Math.round(mean * (0.3 + r() * 1.4) * drive) });
      }
    }
  }

  takes.sort((a, b) => (a.at < b.at ? -1 : 1));
  questions.sort((a, b) => (a.at < b.at ? -1 : 1));
  return { students, takes, questions, reactions, usage, days };
}
