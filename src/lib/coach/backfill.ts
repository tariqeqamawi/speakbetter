// Filling in an older review.
//
// The first reviews were written before Coach gave "What worked", the
// cited lessons judged, the skills used without being asked and "Since
// you started". Those reviews are still on the student's phone - the
// notes, the moments, what Coach said aloud - but the video is long
// gone (§13). So the missing sections are written once, from that
// record alone: a small text-only call, never a second watching, and
// never a credit for anything the record doesn't show.
//
// Without the coach (no key, or the call fails) the same sections are
// read straight off the stored notes instead (deriveBackfill), which is
// thinner but never wrong about what happened.

import { challengeBySlug, type Challenge } from "@/data/challenges";
import { lessonByVimeoId, lessons } from "@/data/lessons";
import { categories, type CategoryId } from "@/data/categories";
import type { Observations } from "./rubric";
import { lessonBlock } from "./context";

export interface BackfillNote {
  category: CategoryId;
  note: string;
  lessonIds?: string[];
  at?: string;
}

/** What the phone sends: the stored review, and the takes before it. */
export interface BackfillInput {
  challengeSlug: string;
  score: number;
  passed: boolean;
  durationSec: number;
  spectrum: Record<string, number>;
  summary: string;
  spoken?: string;
  briefVerdict?: string;
  focus: BackfillNote[];
  fullNotes: BackfillNote[];
  criteria?: { text: string; met: boolean; evidence: string }[];
  moments?: { at: string; kind: string; category: string; what: string }[];
  observations?: Observations;
  /** Earlier takes, oldest first, in practice-panel's takeHistory shape. */
  history?: { date: string; challenge: string; score: number; passed: boolean; spectrum?: Record<string, number>; observations?: Observations }[];
  /** Read from the notes only - the stand-in coach's reviews, and offline. */
  deriveOnly?: boolean;
}

export interface BackfillResult {
  strengths: BackfillNote[];
  lessonsUsed: { lessonId: string; used: boolean; quality: number; evidence: string }[];
  skillsSpotted: { lessonId: string; quality: number; at?: string; evidence: string }[];
  progress?: string;
  method: "coach" | "notes";
}

export const BACKFILL_SCHEMA = {
  type: "object",
  properties: {
    strengths: {
      type: "array",
      description: "What worked, from the record only. Two to four.",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          note: { type: "string" },
          lessonIds: { type: "array", items: { type: "string" } },
          at: { type: "string" },
        },
        required: ["category", "note", "lessonIds"],
      },
    },
    lessonsUsed: {
      type: "array",
      description: "One entry per cited lesson, in the order given.",
      items: {
        type: "object",
        properties: {
          lessonId: { type: "string" },
          used: { type: "boolean" },
          quality: { type: "integer", description: "0-10. 0 when not used." },
          evidence: { type: "string" },
        },
        required: ["lessonId", "used", "quality", "evidence"],
      },
    },
    skillsSpotted: {
      type: "array",
      description: "Lessons NOT in the cited list whose technique the record shows. Empty if none.",
      items: {
        type: "object",
        properties: {
          lessonId: { type: "string" },
          quality: { type: "integer" },
          at: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["lessonId", "quality", "evidence"],
      },
    },
    progress: {
      type: "string",
      description: "Two to four sentences on what shifted since the earlier takes, or empty with none.",
    },
  },
  required: ["strengths", "lessonsUsed", "skillsSpotted", "progress"],
};

const BACKFILL_BRIEF = `You are the Speak Better coach, filling in the missing sections of a review you wrote earlier. You no longer have the video. You have only the record of that review: your notes, the moments you timed, what you said aloud, the criteria as you judged them, and the measurements. Write the missing sections from that record and nothing else.

THE ONE RULE: credit nothing the record doesn't show. A cited lesson is "used" only when a note, a moment or your spoken review describes the student actually doing what that lesson teaches - quote or paraphrase that evidence, with its time where the record has one. Otherwise used is false, quality 0, and the evidence says briefly what the lesson would have added. A skill spotted must be a lesson outside the cited list that a note or moment plainly shows; an empty list is better than a generous one. Strengths are only the things a note, a moment or your spoken review says worked - never a guess from a score - in your coaching voice - warm, specific, second person, tied to the lesson where one fits. Progress compares this take with the earlier ones using only their numbers and observations (filler words, eye contact, the colors, the score); say "early days" lightly with one earlier take and leave it empty with none. If the record shows nothing that worked, return no strengths. Never mention that you are filling anything in.`;

/** The call's two halves: the brief, and this review's record. */
export function backfillPrompt(input: BackfillInput): { system: string; prompt: string } | null {
  const challenge = challengeBySlug.get(input.challengeSlug);
  if (!challenge) return null;
  const citedIds = challenge.relatedLessonIds.filter((id) => lessonByVimeoId.has(id));
  const record = {
    score: input.score,
    passed: input.passed,
    seconds: input.durationSec,
    spectrum: input.spectrum,
    summary: input.summary,
    briefVerdict: input.briefVerdict,
    criteria: input.criteria,
    notes: input.fullNotes.length ? input.fullNotes : input.focus,
    nextTime: input.focus,
    moments: input.moments,
    observations: input.observations,
    spokenReview: input.spoken,
  };
  const prompt = [
    `# The challenge: ${challenge.title}`,
    `Brief: ${challenge.brief}`,
    `Target skills: ${challenge.targetSkills.join(", ")}`,
    "",
    "## The record of this review",
    JSON.stringify(record).slice(0, 14_000),
    ...(input.history?.length
      ? ["", "## The student's earlier takes, oldest first", JSON.stringify(input.history).slice(0, 8_000)]
      : ["", "## Earlier takes: none"]),
    "",
    "## The lessons cited for this challenge (lessonsUsed - one entry each, in this order)",
    ...citedIds.map((id) => lessonBlock(id, false)),
    "",
    "## The rest of the library (skillsSpotted may only name these)",
    ...lessons.filter((l) => !citedIds.includes(l.vimeoId)).map((l) => `- ${l.vimeoId}: ${l.title} (${l.category})`),
    "",
    `Category ids: ${categories.map((c) => c.id).join(", ")}. Answer in the required JSON shape.`,
  ].join("\n");
  return { system: BACKFILL_BRIEF, prompt };
}

const catIds = new Set<string>(categories.map((c) => c.id));
const asCat = (v: unknown, fallback: CategoryId): CategoryId =>
  typeof v === "string" && catIds.has(v) ? (v as CategoryId) : fallback;
const clamp10 = (n: unknown) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));
const known = (ids: unknown) =>
  (Array.isArray(ids) ? ids : []).map(String).filter((id) => lessonByVimeoId.has(id));

/** The model's answer, held to the app's shape and to the cited list. */
export function shapeBackfill(raw: Partial<Record<keyof BackfillResult, unknown>>, challenge: Challenge): BackfillResult {
  const fallback = challenge.targetSkills[0] ?? "mindset";
  const cited = challenge.relatedLessonIds.filter((id) => lessonByVimeoId.has(id));
  const given = new Map(
    (Array.isArray(raw.lessonsUsed) ? raw.lessonsUsed : []).map((l: Record<string, unknown>) => [String(l.lessonId), l]),
  );
  return {
    strengths: (Array.isArray(raw.strengths) ? raw.strengths : [])
      .map((n: Record<string, unknown>) => ({
        category: asCat(n.category, fallback),
        note: String(n.note ?? "").trim(),
        lessonIds: known(n.lessonIds),
        at: n.at ? String(n.at) : undefined,
      }))
      .filter((n) => n.note),
    // Every cited lesson, in order, whether or not the model answered for it.
    lessonsUsed: cited.map((id) => {
      const l = given.get(id);
      const used = Boolean(l?.used);
      return { lessonId: id, used, quality: used ? clamp10(l?.quality) : 0, evidence: String(l?.evidence ?? "") };
    }),
    skillsSpotted: (Array.isArray(raw.skillsSpotted) ? raw.skillsSpotted : [])
      .filter((s: Record<string, unknown>) => lessonByVimeoId.has(String(s.lessonId)) && !cited.includes(String(s.lessonId)))
      .map((s: Record<string, unknown>) => ({
        lessonId: String(s.lessonId),
        quality: clamp10(s.quality),
        at: s.at ? String(s.at) : undefined,
        evidence: String(s.evidence ?? ""),
      })),
    progress: String(raw.progress ?? "").trim() || undefined,
    method: "coach",
  };
}

/**
 * The same sections read straight off the stored notes - no model. A
 * cited lesson a note names counts as used; a lesson from elsewhere
 * named on a note in a strong color counts as spotted; the strong
 * colors' notes are what worked; progress is the numbers.
 */
export function deriveBackfill(input: BackfillInput): BackfillResult | null {
  const challenge = challengeBySlug.get(input.challengeSlug);
  if (!challenge) return null;
  const notes = [...input.fullNotes, ...input.focus];
  const cited = challenge.relatedLessonIds.filter((id) => lessonByVimeoId.has(id));
  const strong = (c: string) => (input.spectrum[c] ?? 0) >= 60;
  const focusText = new Set(input.focus.map((n) => n.note));

  const strengths = input.fullNotes.filter((n) => strong(n.category) && !focusText.has(n.note)).slice(0, 4);

  const lessonsUsed = cited.map((id) => {
    const note = notes.find((n) => n.lessonIds?.includes(id) && strong(n.category) && !focusText.has(n.note));
    return note
      ? { lessonId: id, used: true, quality: Math.max(4, Math.min(9, Math.round((input.spectrum[note.category] ?? 60) / 10))), evidence: note.note }
      : { lessonId: id, used: false, quality: 0, evidence: "" };
  });

  const seen = new Set<string>();
  const skillsSpotted = strengths.flatMap((n) =>
    (n.lessonIds ?? [])
      .filter((id) => !cited.includes(id) && lessonByVimeoId.has(id) && !seen.has(id) && seen.add(id))
      .map((id) => ({ lessonId: id, quality: Math.max(4, Math.min(9, Math.round((input.spectrum[n.category] ?? 60) / 10))), at: n.at, evidence: n.note })),
  );

  let progress: string | undefined;
  const first = input.history?.[0];
  if (first) {
    const lit = (s?: Record<string, number>) => Object.values(s ?? {}).filter((v) => v >= 40).length;
    const bits = [
      `Your first take scored ${first.score}; this one scored ${input.score}.`,
      `${lit(first.spectrum)} of 7 colors were lit then, and ${lit(input.spectrum)} here.`,
    ];
    const f0 = first.observations?.fillerWords;
    const f1 = input.observations?.fillerWords;
    if (typeof f0 === "number" && typeof f1 === "number" && f0 !== f1)
      bits.push(`Filler words went from ${f0} to ${f1}${f1 < f0 ? " - that's real improvement." : " - one to keep an eye on."}`);
    progress = bits.join(" ");
  }

  return { strengths, lessonsUsed, skillsSpotted, progress, method: "notes" };
}
