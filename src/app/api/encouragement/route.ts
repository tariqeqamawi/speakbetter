import { NextResponse } from "next/server";
import type { EncouragementContext } from "@/lib/encouragement";

// ─────────────────────────────────────────────────────────────────────
// The coach's encouragement.
//
// INTEGRATION SWAP POINT: this composes the line from the student's real
// figures. When an LLM is wired in, the same context object becomes the
// prompt and this becomes the fallback for when the call fails — the
// contract the client depends on does not change.
//
// The rule that must survive that swap: every claim is checked against
// the record first. The coach only ever congratulates someone on
// something that actually happened.
// ─────────────────────────────────────────────────────────────────────

interface Line {
  /** Only offered when this is genuinely true of the student */
  when: (c: EncouragementContext) => boolean;
  /** How notable — the strongest true thing gets said */
  weight: number;
  say: (c: EncouragementContext) => string[];
}

const LINES: Line[] = [
  {
    // The headline the whole course promises: a widening spectrum.
    when: (c) => c.colorsNow > c.colorsThen && c.uploads >= 2,
    weight: 100,
    say: (c) => [
      `Look at your range. Your first talk lit up ${c.colorsThen} ${plural(c.colorsThen, "color")} — your latest reached ${c.colorsNow}. That's you becoming genuinely more dynamic.`,
      `You're ${c.colorsNow - c.colorsThen} ${plural(c.colorsNow - c.colorsThen, "color")} wider than when you started. That's not a small thing — that's the whole point of this.`,
      `${c.colorsThen} ${plural(c.colorsThen, "color")} then, ${c.colorsNow} now. You're reaching for more of yourself every time you record.`,
    ],
  },
  {
    when: (c) => c.scoreNow > c.scoreThen + 8,
    weight: 90,
    say: (c) => [
      `You opened at ${c.scoreThen} and you're at ${c.scoreNow} now. ${c.scoreNow - c.scoreThen} points of real improvement, earned one attempt at a time.`,
      `From ${c.scoreThen} to ${c.scoreNow}. Whatever you're doing differently — keep doing it.`,
    ],
  },
  {
    when: (c) => c.mostAttemptsOnOne >= 3,
    weight: 85,
    say: (c) => [
      `You've gone back at the same challenge ${c.mostAttemptsOnOne} times. Most people never try twice. That persistence is exactly what makes speakers.`,
      `${c.mostAttemptsOnOne} attempts at one challenge — that's the practicing instinct, and it's rarer than talent.`,
    ],
  },
  {
    when: (c) => c.streak >= 3,
    weight: 80,
    say: (c) => [
      `${c.streak} days in a row now. Consistency like that compounds faster than you'd think.`,
      `A ${c.streak}-day streak. You're not cramming — you're building a habit, which is the thing that actually lasts.`,
    ],
  },
  {
    when: (c) => c.percentComplete >= 20 && c.percentComplete < 100,
    weight: 60,
    say: (c) => [
      `You're ${c.percentComplete}% through the journey — ${c.challengesPassed} of ${c.challengesTotal} challenges passed. Keep going.`,
      `${c.percentComplete}% done. You're past the part where most people stop.`,
    ],
  },
  {
    when: (c) => c.missingColors.length > 0 && c.missingColors.length <= 3 && c.uploads >= 3,
    weight: 50,
    say: (c) => [
      `You're strong across most of the spectrum. ${c.missingColors[0]} is the one you haven't reached yet — try leaning into it next time.`,
      `One color left to unlock: ${c.missingColors[0]}. Go looking for it in your next talk.`,
    ],
  },
  {
    when: (c) => c.uploads >= 1,
    weight: 20,
    say: (c) => [
      `${c.uploads} ${plural(c.uploads, "talk")} recorded. Every one of them is practice most people never get.`,
      `You've put yourself on camera ${c.uploads} ${plural(c.uploads, "time")}. That takes something. Keep going.`,
    ],
  },
];

function plural(n: number, word: string) {
  return n === 1 ? word : `${word}s`;
}

export async function POST(request: Request) {
  const context = (await request.json()) as EncouragementContext;

  const candidates = LINES.filter((l) => l.when(context)).sort(
    (a, b) => b.weight - a.weight,
  );
  if (candidates.length === 0) {
    return NextResponse.json({ message: null });
  }

  // Take the most notable true thing, varying the phrasing so a
  // returning student doesn't hear the same sentence twice.
  const chosen = candidates[0];
  const options = chosen.say(context);
  const message = options[Math.floor(Math.random() * options.length)];

  return NextResponse.json({ message, generated: false });
}
