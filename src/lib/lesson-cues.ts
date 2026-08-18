// The key ideas the player floats beside the teacher, timed to the second
// the teacher says them. Built from the lesson transcripts by
// `npm run build:cues` - see scripts/build-lesson-cues.mjs for how a
// phrase earns its place.

export interface LessonCue {
  /** Seconds into the lesson, a beat before the words land. */
  t: number;
  /** The phrase, title-cased; the player renders it uppercase. */
  w: string;
}

// One table covers all 121 videos in ~12 KB, so it's fetched whole - but
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
