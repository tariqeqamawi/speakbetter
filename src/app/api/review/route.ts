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
  lessonIds?: string[];
}

/** A canned observation plus the Skills lesson(s) it draws on — the tie
 * between coaching and curriculum (§08). Strengths link the lesson
 * teaching the skill the student just used (perhaps by accident);
 * improvements link the lesson that fixes the gap. */
interface Observation {
  note: string;
  lessonIds: string[];
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

const strengths: Record<CategoryId, Observation[]> = {
  storytelling: [
    {
      note: "You dropped into a specific scene instead of summarizing — that's exactly what makes listeners lean in.",
      lessonIds: ["1081031433"], // Life Scene NOT Life Story
    },
    {
      note: "The moral landed naturally at the end rather than being bolted on.",
      lessonIds: ["1081292414"], // Add The Moral or Message
    },
  ],
  figurative: [
    {
      note: "That comparison was fresh — nobody has heard it before, so it stuck.",
      lessonIds: ["1081032528"], // Metaphors
    },
    {
      note: "Your imagery touched more than one sense, which makes it immersive.",
      lessonIds: ["1080679081"], // Visual, Aural & Kinaesthetic Speaking
    },
  ],
  acting: [
    {
      note: "Your vocal variety kept the delivery musical — tone shifts arrived right on the story beats.",
      lessonIds: ["1080675446"], // Making Your Message a Melody
    },
    {
      note: "You embodied the moment instead of reporting it.",
      lessonIds: ["1081163657"], // Simulate Sounds & Embody Emotions
    },
  ],
  structure: [
    {
      note: "Strong open — you earned attention in the first ten seconds.",
      lessonIds: ["1081198798"], // How To Open Your Talk
    },
    {
      note: "The promise you made early paid off cleanly at the end.",
      lessonIds: ["1081163913"], // Using Promise & Payoff
    },
  ],
  mindset: [
    {
      note: "You spoke from conviction — it reads as presence on camera.",
      lessonIds: ["1081162517"], // As The Speaker You Have ALL The Power!
    },
    {
      note: "No apologizing, no shrinking. You owned the frame.",
      lessonIds: ["1081162517"],
    },
  ],
  "body-language": [
    {
      note: "Your gestures expressed visually what you said verbally.",
      lessonIds: ["1080653314"], // Hand Gestures
    },
    {
      note: "Open posture, steady eye line — the camera reads you as confident.",
      lessonIds: ["1081137961"], // Opening Your Posture
    },
  ],
  advanced: [
    {
      note: "That pause before the key line was a genuine mic-drop setup.",
      lessonIds: ["1081162033"], // Powerful Pause vs Awkward Silence
    },
    {
      note: "Succinct and clean — nothing overstayed its welcome.",
      lessonIds: ["1081200223"], // Staying Succinct: Pro Tip
    },
  ],
};

const improvements: Record<CategoryId, Observation[]> = {
  storytelling: [
    {
      note: "Zoom further into one moment — give us the scene, not the summary.",
      lessonIds: ["1081031433"], // Life Scene NOT Life Story
    },
    {
      note: "Try opening inside the action instead of with background.",
      lessonIds: ["1081294121"], // Give The Setting Then Dive Into The Scene
    },
  ],
  figurative: [
    {
      note: "One vivid metaphor would have lifted the flattest stretch.",
      lessonIds: ["1081032528"], // Metaphors
    },
    {
      note: "Reach past the first adjective that comes to mind.",
      lessonIds: ["1081032662"], // Similes
    },
  ],
  acting: [
    {
      note: "A few filler words crept in under pressure — swap them for silent pauses.",
      lessonIds: ["1080629747"], // What Are Filler Words
    },
    {
      note: "Let your voice range wider: the melody flattened in the middle third.",
      lessonIds: ["1080675446"], // Making Your Message a Melody
    },
  ],
  structure: [
    {
      note: "The ending arrived without warning — plant a promise early so the close pays it off.",
      lessonIds: ["1081163913"], // Using Promise & Payoff
    },
    {
      note: "Try a rhetorical question to re-hook attention mid-talk.",
      lessonIds: ["1080662335"], // Rhetorical Questions
    },
  ],
  mindset: [
    {
      note: "There's an apology hiding in your opening posture — begin as if the audience is already on your side.",
      lessonIds: ["1081162517"], // As The Speaker You Have ALL The Power!
    },
    {
      note: "Soften rather than push through nerves.",
      lessonIds: ["1094881996"], // How To Overcome Your Fear Of Speaking: Soften
    },
  ],
  "body-language": [
    {
      note: "Your hands went quiet during the key moment — that's exactly when they should be painting.",
      lessonIds: ["1080653314"], // Hand Gestures
    },
    {
      note: "Check your eye line: you drifted off-lens during transitions.",
      lessonIds: ["1081032074"], // How To Speak Naturally To a Phone or Camera
    },
  ],
  advanced: [
    {
      note: "One deliberate pause before your best line would have doubled its weight.",
      lessonIds: ["1081162033"], // Powerful Pause vs Awkward Silence
    },
    {
      note: "Trim the runway: the first two sentences could go entirely.",
      lessonIds: ["1081200223"], // Staying Succinct: Pro Tip
    },
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

  const toNote = (category: CategoryId, obs: Observation): Note => ({
    category,
    note: obs.note,
    lessonIds: obs.lessonIds,
  });

  // Focus notes: 2–3, anchored to the challenge's target skills (§08).
  const focusCategories = challenge.targetSkills.slice(0, 3);
  const focus: Note[] = focusCategories.map((category) =>
    toNote(category, pick(rand, improvements[category])),
  );

  // Full notes: everything the AI noticed — strengths + improvements
  // across the whole spectrum (revealed at Intermediate/Advanced, §09).
  // Strengths carry the lesson behind the skill the student just used,
  // so a skill hit by instinct can be studied on purpose.
  const fullNotes: Note[] = categories.flatMap((cat) => {
    const value = spectrum[cat.id];
    if (value >= 60) return [toNote(cat.id, pick(rand, strengths[cat.id]))];
    if (value <= 35) return [toNote(cat.id, pick(rand, improvements[cat.id]))];
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
