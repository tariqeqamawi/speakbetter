import { challenges } from "@/data/challenges";
import { categories, type CategoryId } from "@/data/categories";
import { priceCents, UPGRADE_CENTS, type Plan } from "@/data/pricing";

// A made-up cohort for the admin dashboard to stand on until the real
// one arrives (supabase/training.sql). Forty students over a full six-week
// cohort (3 October to 13 November),
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
  /** Tariq's own score, on the takes he reviewed himself. */
  tariqScore?: number;
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
  tier: Plan;
  /** Everything they paid, upgrade included, before any refund. */
  paidCents: number;
  upgraded: boolean;
  refunded: boolean;
  /** Still practising in the final week. */
  completed: boolean;
  /** Stayed on month to month after the six weeks. */
  monthly: boolean;
  confidenceStart: number;
  confidenceEnd?: number;
  recommend?: number;
  story?: string;
  quoteOk?: boolean;
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
  ["How do I end a talk well?", "Frame"],
  ["Why do I speed up when I'm nervous?", "Nerves"],
  ["How do I sound more confident on Zoom?", "Presence"],
  ["What's a good hook for a story?", "Frame"],
  ["How do I look at the camera and not the screen?", "Eye contact"],
  ["Where should my hands be when I'm not gesturing?", "Gestures"],
  ["How do I get rid of 'like'?", "Filler words"],
];

/** Every part of the app with a 🔥/👇 under it (components/feature-reaction.tsx). */
export const FEATURE_NAME: Record<string, string> = {
  road: "The road",
  dial: "Skill dial",
  lessons: "Lessons",
  deck: "Card deck",
  dashboard: "Dashboard",
  trophies: "Trophy case",
  "ask-coach": "Ask Coach",
  live: "Live sessions",
  community: "Community",
};

const REACTION_NOTES: Record<string, string[]> = {
  road: ["The 3D road makes my phone hot", "Wish I could see what's next without scrolling"],
  lessons: ["Some lessons feel too short to get the idea", "I'd like subtitles on every lesson"],
  live: ["The time zone is hard for me", "Wish the recordings had chapters"],
  community: ["Rooms are quiet in the mornings", "Hard to find people at my level"],
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
  lessons: 0.86,
  live: 0.82,
  community: 0.58,
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

const STORIES = [
  "I used to rehearse voicemails. Last week I gave a toast at my sister's wedding and people came up to me afterwards.",
  "The filler words are mostly gone. My manager noticed before I told her I was doing this.",
  "I pitched to investors on Zoom and didn't read from my notes once.",
  "I finally started the YouTube channel I'd been putting off for two years.",
  "I stopped apologising at the start of every meeting I run.",
  "Seeing my own colors grow week by week kept me going when I wanted to quit.",
];

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
// Where each color starts against the student's overall skill: a first
// take lights two or so (story and confidence come first), the rest
// arrive challenge by challenge, Advanced last.
const START: Record<CategoryId, number> = {
  storytelling: -10,
  figurative: -26,
  acting: -22,
  structure: -18,
  mindset: -12,
  "body-language": -20,
  advanced: -40,
};

export function sampleCohort(now = Date.UTC(2026, 10, 13)): SampleCohort {
  const r = rng(40);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const start = now - 41 * DAY;
  const days = Array.from({ length: 42 }, (_, i) => new Date(start + i * DAY).toISOString().slice(0, 10));
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
    // A second stream for what came later, so the patterns above stay put.
    const r2 = rng(400 + n);

    // Along the road, one challenge at a time, until they stop.
    let day = joinedDay;
    let skill = 45 + r() * 20 + (level === "advanced" ? 12 : level === "intermediate" ? 6 : 0);
    let lastActive = joinedDay;
    let reachedEnd = false;
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
          // Tariq reviews about one take in eight himself. Coach's gap
          // from him narrows as he's corrected, week by week.
          tariqScore:
            r2() < 0.13 ? Math.round(Math.max(10, Math.min(99, score + (r2() - 0.5) * 2 * (16 - (day / 42) * 11)))) : undefined,
        });
        lastActive = day;
        taken++;
        if (i === road.length - 1) reachedEnd = true;
        day += r() < 0.7 ? 1 : 2;
      }
      const stay = hard ? 0.8 + 0.15 * drive : 0.94 + 0.055 * drive;
      if (r() > stay) break;
    }

    // Who they were as a customer, and what they said at the ends.
    const tierRoll = r2();
    let tier: Plan = tierRoll < 0.45 ? "foundations" : tierRoll < 0.85 ? "coached" : "founders";
    let paidCents = priceCents[tier];
    const upgraded = tier === "foundations" && drive > 0.6 && r2() < 0.35;
    if (upgraded) {
      tier = "coached";
      paidCents += UPGRADE_CENTS;
    }
    const refunded = lastActive - joinedDay < 10 && r2() < 0.3;
    const completed = !refunded && (reachedEnd || lastActive >= days.length - 7);
    const confidenceStart = Math.max(1, Math.min(7, Math.round(2 + r2() * 4 + (level === "advanced" ? 1 : 0))));
    const confidenceEnd = completed ? Math.min(10, confidenceStart + 2 + Math.round(r2() * 3.4)) : undefined;
    const recommend = completed ? (r2() < 0.72 ? 9 + Math.round(r2()) : r2() < 0.8 ? 7 + Math.round(r2()) : 5) : undefined;
    const story = completed && r2() < 0.6 ? STORIES[Math.floor(r2() * STORIES.length)] : undefined;
    students.push({
      number: n,
      level,
      joined: days[joinedDay],
      tier,
      paidCents,
      upgraded,
      refunded,
      completed,
      monthly: completed && r2() < 0.42,
      confidenceStart,
      confidenceEnd,
      recommend,
      story,
      quoteOk: story ? r2() < 0.75 : undefined,
    });

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
