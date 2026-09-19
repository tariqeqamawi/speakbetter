// The review as the app receives it - the one contract the feedback
// screen, the spectrum, the badges and the then-and-now all read. The
// mock returns this shape and so does the real coach; the client never
// needs to know which it got, except for the `mock` flag.

import type { CategoryId } from "@/data/categories";
import type { Level } from "@/lib/store";
import { categories } from "@/data/categories";
import { lessonByVimeoId } from "@/data/lessons";
import { levelAllowance, passBar, type CoachVerdict } from "./rubric";

export interface ReviewNote {
  category: CategoryId;
  note: string;
  lessonIds?: string[];
  /** m:ss in the student's video, where the coach gives one. */
  at?: string;
}

export interface ReviewResponse {
  passed: boolean;
  score: number;
  spectrum: Record<CategoryId, number>;
  /** The two or three things to work on next - every level sees these. */
  focus: ReviewNote[];
  /** Everything the coach noticed - strengths and improvements. */
  fullNotes: ReviewNote[];
  /** What worked, on its own - shown to every level before the
   *  improvements. Absent from the mock. */
  strengths?: ReviewNote[];
  /** The review as the coach says it aloud, verdict last. Absent from
   *  the mock. */
  spoken?: string;
  summary: string;
  /** The brief, judged. Absent from the mock. */
  briefVerdict?: string;
  criteria?: { text: string; met: boolean; evidence: string }[];
  /** The cited lessons, judged. Absent from the mock. */
  lessonsUsed?: { lessonId: string; used: boolean; quality: number; evidence: string }[];
  /** Techniques from other lessons the student used, knowingly or not.
   *  Shown at Intermediate and Advanced (§08). */
  skillsSpotted?: { lessonId: string; quality: number; at?: string; evidence: string }[];
  mock: boolean;
  /** Which model watched, for the record. */
  model?: string;
}

const ids = new Set<string>(categories.map((c) => c.id));

function asCategory(value: string, fallback: CategoryId): CategoryId {
  const v = value.trim().toLowerCase();
  if (ids.has(v)) return v as CategoryId;
  // A model that says "body language" instead of "body-language", or
  // names the category rather than the id, still lands on the right
  // color.
  const byName = categories.find(
    (c) => c.name.toLowerCase() === v || c.id.replace("-", " ") === v || c.code.toLowerCase() === v,
  );
  return byName?.id ?? fallback;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
/** Lesson quality is out of ten - a score people can feel, not audit. */
const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));

/** Only lesson ids that exist - the coach is told to cite from a list,
 *  and a wrong id would render as a dead link. */
const knownLessons = (list: string[] | undefined) =>
  (list ?? []).filter((id) => lessonByVimeoId.has(String(id))).map(String);

/**
 * The coach's verdict, in the app's shape.
 *
 * Pass is decided here, not by the model: every criterion met AND the
 * overall score at the level's bar. The model is asked to keep its
 * score consistent with its own criteria, but the app holds the rule.
 */
export function shapeVerdict(
  verdict: CoachVerdict,
  level: Level,
  targetSkills: CategoryId[],
  model: string,
): ReviewResponse {
  const spectrum = {} as Record<CategoryId, number>;
  for (const c of categories) spectrum[c.id] = 0;
  for (const s of verdict.spectrum ?? []) {
    const id = asCategory(s.category, targetSkills[0] ?? "mindset");
    spectrum[id] = clamp(s.score);
  }

  const fallback = targetSkills[0] ?? "mindset";
  const toNote = (n: CoachVerdict["strengths"][number]): ReviewNote => ({
    category: asCategory(n.category, fallback),
    note: String(n.note ?? "").trim(),
    lessonIds: knownLessons(n.lessonIds),
    at: n.at ? String(n.at) : undefined,
  });

  const improvements = (verdict.improvements ?? []).map(toNote).filter((n) => n.note);
  const strengths = (verdict.strengths ?? []).map(toNote).filter((n) => n.note);

  // Focus: the first improvements, favouring the challenge's own
  // skills, because those are the ones this challenge is for. Three at
  // most; the rest wait in the full notes.
  const onTarget = improvements.filter((n) => targetSkills.includes(n.category));
  const offTarget = improvements.filter((n) => !targetSkills.includes(n.category));
  const focus = [...onTarget, ...offTarget].slice(0, 3);

  const criteria = (verdict.criteria ?? []).map((c) => ({
    text: String(c.text ?? ""),
    met: Boolean(c.met),
    evidence: String(c.evidence ?? ""),
  }));
  const allMet = criteria.length > 0 && criteria.every((c) => c.met);
  // The model's score is level-blind; the level's allowance goes on
  // here, and a brief not met keeps the model's own ceiling.
  const lifted = clamp(verdict.score) + levelAllowance(level);
  const score = allMet ? Math.min(100, lifted) : Math.min(55, lifted);
  const passed = allMet && score >= passBar(level);

  // The verdict is the app's to give, and it's given last - the whole
  // review first, then the one line they were waiting for.
  const body = String(verdict.spoken ?? "").trim().replace(/\s+$/, "");
  const closing = passed
    ? "And that means... congratulations. You've passed this challenge."
    : "So this one didn't pass. Keep going - your speaking is developing, and I'm sure you'll get it on the next attempt. Record a new video, upload it, and I'll be here waiting.";
  const spoken = body ? `${body} ${closing}` : undefined;

  return {
    passed,
    score,
    spectrum,
    focus,
    fullNotes: [...strengths, ...improvements],
    strengths,
    spoken,
    summary: String(verdict.summary ?? "").trim(),
    briefVerdict: String(verdict.briefVerdict ?? "").trim() || undefined,
    criteria,
    lessonsUsed: (verdict.lessonsUsed ?? []).map((l) => ({
      lessonId: String(l.lessonId),
      used: Boolean(l.used),
      quality: clamp10(l.quality),
      evidence: String(l.evidence ?? ""),
    })),
    skillsSpotted: (verdict.skillsSpotted ?? [])
      .filter((s) => lessonByVimeoId.has(String(s.lessonId)))
      .map((s) => ({
        lessonId: String(s.lessonId),
        quality: clamp10(s.quality),
        at: s.at ? String(s.at) : undefined,
        evidence: String(s.evidence ?? ""),
      })),
    mock: false,
    model,
  };
}
