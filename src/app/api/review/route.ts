import { NextResponse } from "next/server";
import { challengeBySlug } from "@/data/challenges";
import { categories, type CategoryId } from "@/data/categories";

// ─────────────────────────────────────────────────────────────────────
// AI review endpoint — build plan Phase 4.
//
// INTEGRATION SWAP POINT (master plan §07, stack §19): this is a mock.
// The real implementation receives the uploaded video, has Gemini watch
// it against the challenge's criteria + the transcript/video reference
// layer (§08), then deletes the video (§13). The request/response
// contract below is the one Gemini's analysis will be mapped into —
// the client should not need to change.
// ─────────────────────────────────────────────────────────────────────

interface ReviewRequest {
  challengeSlug: string;
  durationSec: number;
  level: "beginner" | "intermediate" | "advanced";
  attemptNumber: number; // 1-based
}

interface Note {
  category: CategoryId;
  note: string;
}

// Deterministic PRNG so the same attempt always reviews the same way.
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

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const strengths: Record<CategoryId, string[]> = {
  storytelling: [
    "You dropped into a specific scene instead of summarizing — that's exactly what makes listeners lean in.",
    "The moral landed naturally at the end rather than being bolted on.",
  ],
  figurative: [
    "That comparison was fresh — nobody has heard it before, so it stuck.",
    "Your imagery touched more than one sense, which makes it immersive.",
  ],
  acting: [
    "Your vocal variety kept the delivery musical — tone shifts arrived right on the story beats.",
    "You embodied the moment instead of reporting it.",
  ],
  structure: [
    "Strong open — you earned attention in the first ten seconds.",
    "The promise you made early paid off cleanly at the end.",
  ],
  mindset: [
    "You spoke from conviction — it reads as presence on camera.",
    "No apologizing, no shrinking. You owned the frame.",
  ],
  "body-language": [
    "Your gestures expressed visually what you said verbally.",
    "Open posture, steady eye line — the camera reads you as confident.",
  ],
  advanced: [
    "That pause before the key line was a genuine mic-drop setup.",
    "Succinct and clean — nothing overstayed its welcome.",
  ],
};

const improvements: Record<CategoryId, string[]> = {
  storytelling: [
    "Zoom further into one moment — give us the scene, not the summary. Revisit 'Life Scene NOT Life Story'.",
    "Try opening inside the action instead of with background. 'Give The Setting Then Dive Into The Scene' shows the move.",
  ],
  figurative: [
    "One vivid metaphor would have lifted the flattest stretch. The Metaphors lesson has the pattern.",
    "Reach past the first adjective that comes to mind — 'Avoid Boring Words' territory.",
  ],
  acting: [
    "A few filler words crept in under pressure — swap them for silent pauses ('What Are Filler Words').",
    "Let your voice range wider: the melody flattened in the middle third ('Making Your Message a Melody').",
  ],
  structure: [
    "The ending arrived without warning — plant a promise early so the close pays it off ('Using Promise & Payoff').",
    "Try a rhetorical question to re-hook attention mid-talk ('Rhetorical Questions').",
  ],
  mindset: [
    "There's an apology hiding in your opening posture — begin as if the audience is already on your side ('As The Speaker You Have ALL The Power!').",
    "Soften rather than push through nerves — the Soften lesson has the technique.",
  ],
  "body-language": [
    "Your hands went quiet during the key moment — that's exactly when they should be painting ('Hand Gestures').",
    "Check your eye line: you drifted off-lens during transitions ('How To Speak Naturally To a Phone or Camera').",
  ],
  advanced: [
    "One deliberate pause before your best line would have doubled its weight ('Powerful Pause vs Awkward Silence').",
    "Trim the runway: the first two sentences could go entirely ('Staying Succinct').",
  ],
};

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReviewRequest;
  const challenge = challengeBySlug.get(body.challengeSlug);
  if (!challenge) {
    return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });
  }
  if (body.durationSec > 183) {
    return NextResponse.json(
      { error: "Videos must be three minutes or less." },
      { status: 400 },
    );
  }

  const rand = mulberry32(hash(`${body.challengeSlug}:${body.attemptNumber}`));

  // Scores improve with repetition — the mock rewards exactly the
  // behavior the course is built around.
  const practice = Math.min(body.attemptNumber - 1, 5) * 4;
  const base = 55 + practice + Math.floor(rand() * 18);
  const score = Math.min(98, base);

  const passThreshold =
    body.level === "beginner" ? 60 : body.level === "intermediate" ? 70 : 78;
  const passed = score >= passThreshold;

  // Spectrum: target skills read strongest; others vary. More colors
  // light up as attempts accumulate (the widening spectrum, §10).
  const spectrum = {} as Record<CategoryId, number>;
  for (const cat of categories) {
    const isTarget = challenge.targetSkills.includes(cat.id);
    const floor = isTarget ? 45 + practice : 5 + practice * 2;
    const spread = isTarget ? 45 : 55;
    spectrum[cat.id] = Math.min(97, floor + Math.floor(rand() * spread));
  }

  // Focus notes: 2–3, anchored to the challenge's target skills (§08).
  const focusCategories = challenge.targetSkills.slice(0, 3);
  const focus: Note[] = focusCategories.map((category) => ({
    category,
    note: pick(rand, improvements[category]),
  }));

  // Full notes: everything the AI noticed — strengths + improvements
  // across the whole spectrum (revealed at Intermediate/Advanced, §09).
  const fullNotes: Note[] = categories.flatMap((cat) => {
    const value = spectrum[cat.id];
    if (value >= 60) return [{ category: cat.id, note: pick(rand, strengths[cat.id]) }];
    if (value <= 35) return [{ category: cat.id, note: pick(rand, improvements[cat.id]) }];
    return [];
  });

  const litColors = categories.filter((c) => spectrum[c.id] >= 40).length;
  const summary = passed
    ? `Challenge complete — ${litColors} of 7 colors lit up. ${
        litColors >= 6
          ? "That's a genuinely full-spectrum talk."
          : "Widen the spectrum next attempt and watch the score climb."
      }`
    : `Not there yet — but ${litColors} of 7 colors showed up, and every attempt is compounding. Focus on the notes below and go again.`;

  return NextResponse.json({
    passed,
    score,
    spectrum,
    focus,
    fullNotes,
    summary,
    mock: true, // flag stays until Gemini integration replaces this
  });
}
