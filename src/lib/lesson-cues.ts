// The key ideas the player shows beside the teacher, timed to the second
// he says them. Built from the lesson transcripts by `npm run build:cues`
// - see scripts/build-lesson-cues.mjs for how a moment earns a cue and
// scripts/cues/ for the vocabulary and rhetoric it reads.

export interface LessonCue {
  /** Seconds into the lesson, a beat before the words land. */
  t: number;
  /** The phrase, title-cased; the player renders it uppercase. */
  w: string;
  /**
   * A drawing to show instead of the words - the name of a component in
   * cue-icons.tsx. Single-color stroke, tinted like any other cue.
   */
  icon?: string;
  /**
   * An illustration to show instead, where a picture says it faster than
   * words - a path under /cues. Takes precedence over `icon`.
   */
  img?: string;
}

// One table covers all 121 videos in ~17 KB, so it's fetched whole - but
// lazily, and once per session: nothing about a page that isn't playing a
// lesson should pay for it.
let table: Promise<Record<string, LessonCue[]>> | null = null;

/** This lesson's cues in ascending time order; empty if it has none. */
export async function lessonCues(vimeoId: string): Promise<LessonCue[]> {
  if (!table)
    table = import("@/data/lesson-cues.json").then(
      (m) => m.default as Record<string, LessonCue[]>,
    );
  return (await table)[vimeoId] ?? [];
}
