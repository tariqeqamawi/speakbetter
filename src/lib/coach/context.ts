// What the coach is given about this challenge: the brief, the criteria,
// and the lessons - the ones the challenge cites in full, their
// neighbours in full, and the rest of the library as the one-line
// summaries the cards carry. This is the transcript reference layer
// the plan describes (§08): the coach reasons from the teacher's own
// words, not from what a model happens to believe about public
// speaking.

import { challengeBySlug, type Challenge } from "@/data/challenges";
import { lessons, lessonByVimeoId, lessonsInCategory } from "@/data/lessons";
import { categories } from "@/data/categories";
import { contentFor } from "@/data/card-content";
import { takeaways } from "@/data/takeaways";
import transcripts from "@/data/transcripts.json";
import type { Level } from "@/lib/store";
import { COACH_BRIEF, categoryGuide, levelGuide } from "./rubric";

const transcriptById = new Map(
  (transcripts as { id: string; text: string }[]).map((t) => [t.id, t.text]),
);

/**
 * Lessons that go in full for every review, whatever the challenge:
 * the ones that carry his voice and his stories most. The coach is
 * asked to sound like him and to reach for his examples, and it can
 * only do that from material it has in front of it.
 */
const STYLE_ANCHORS = [
  "1081031584", // Story Time: The Almost Snowboarder
  "1081031902", // Story Time: The Almost Snowboarder - Debrief
  "1081161473", // How To Receive A Standing Ovation
  "1081200420", // How To Use The Skills In Your Challenges
];

/** A style anchor: the transcript, whether or not it's a card lesson. */
function anchorBlock(vimeoId: string): string {
  const entry = (transcripts as { id: string; title: string; text: string }[]).find(
    (t) => t.id === vimeoId,
  );
  if (!entry) return "";
  const lesson = lessonByVimeoId.get(vimeoId);
  const head = lesson
    ? `### ${lesson.title}
id: ${vimeoId} · category: ${lesson.category}`
    : `### ${entry.title}
(not a lesson to cite - here for his voice)`;
  return `${head}
Transcript:
${entry.text.trim()}`;
}

/** A lesson as the coach reads it: in full, or as its card. */
function lessonBlock(vimeoId: string, full: boolean): string {
  const lesson = lessonByVimeoId.get(vimeoId);
  if (!lesson) return "";
  const cat = categories.find((c) => c.id === lesson.category)!;
  const head = `### ${lesson.title}\nid: ${vimeoId} · category: ${cat.id}`;
  if (full) {
    const text = transcriptById.get(vimeoId);
    if (text) return `${head}\nTranscript:\n${text.trim()}`;
  }
  const card = contentFor(vimeoId);
  if (card)
    return `${head}\nWhat: ${card.what}\nHow: ${card.how}\nHe says: ${card.like.map((l) => `"${l}"`).join(" / ")}`;
  const points = takeaways[vimeoId];
  if (points?.length) return `${head}\n- ${points.join("\n- ")}`;
  return head;
}

export interface CoachContext {
  challenge: Challenge;
  /** The lessons the challenge cites - decision 2 is about these. */
  citedIds: string[];
  /** The system instruction. */
  system: string;
  /** The user turn that accompanies the video. */
  prompt: string;
}

/**
 * Everything the coach needs for one review of one challenge.
 *
 * The cited lessons and their category neighbours go in as full
 * transcripts - that's the material the coach is judging against and
 * reaching into first. Everything else in the library goes in as its
 * card (what / how / his own lines), which is enough to name a lesson
 * and the move it teaches when the reach calls for it. All 77 in full
 * would be ten times the tokens for a marginally better reach.
 */
export function buildContext(
  slug: string,
  level: Level,
  attemptNumber: number,
  durationSec: number,
): CoachContext | null {
  const challenge = challengeBySlug.get(slug);
  if (!challenge) return null;

  const citedIds = challenge.relatedLessonIds.filter((id) => lessonByVimeoId.has(id));
  const nearIds = new Set<string>();
  for (const id of citedIds) {
    const lesson = lessonByVimeoId.get(id)!;
    for (const l of lessonsInCategory(lesson.category)) nearIds.add(l.vimeoId);
  }
  for (const cat of challenge.targetSkills)
    for (const l of lessonsInCategory(cat)) nearIds.add(l.vimeoId);
  for (const id of citedIds) nearIds.delete(id);
  const anchorIds = STYLE_ANCHORS.filter(
    (id) => transcriptById.has(id) && !citedIds.includes(id) && !nearIds.has(id),
  );

  const restIds = lessons
    .map((l) => l.vimeoId)
    .filter((id) => !citedIds.includes(id) && !nearIds.has(id) && !anchorIds.includes(id));

  const system = [
    COACH_BRIEF,
    "",
    "THE SEVEN CATEGORIES (use these ids exactly)",
    categoryGuide(),
    "",
    "THE STUDENT'S LEVEL",
    levelGuide(level),
  ].join("\n");

  const prompt = [
    `# The challenge: ${challenge.title}`,
    `Phase ${challenge.phase}. Brief: ${challenge.brief}`,
    `Target skills: ${challenge.targetSkills.join(", ")}`,
    `This is the student's attempt number ${attemptNumber} at this challenge. The recording is ${durationSec} seconds long.`,
    "",
    "## Success criteria (judge each one)",
    ...challenge.criteria.map((c, i) => `${i + 1}. ${c}`),
    "",
    "## The lessons cited for this challenge (decision 2 - judge each one)",
    ...citedIds.map((id) => lessonBlock(id, true)),
    "",
    "## Neighbouring lessons, in full (reach into these first)",
    ...[...nearIds].map((id) => lessonBlock(id, true)),
    "",
    "## His voice - lessons in full, for how he talks and the stories he tells",
    ...anchorIds.map((id) => anchorBlock(id)),
    "",
    "## The rest of the library, as its cards (reach into these where a specific one would lift the take)",
    ...restIds.map((id) => lessonBlock(id, false)),
    "",
    "Watch the recording, then answer in the required JSON shape. Cite lesson ids only from the lists above. Give the spectrum in this order: " +
      categories.map((c) => c.id).join(", ") +
      ". Give the criteria in the order listed, and lessonsUsed in the order the cited lessons are listed.",
  ].join("\n");

  return { challenge, citedIds, system, prompt };
}
