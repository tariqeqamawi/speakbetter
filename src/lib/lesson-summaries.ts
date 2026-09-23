// The prose summary under a lesson - what the video is about, read at
// a glance, before the key ideas and the transcript. Written from each
// lesson's own transcript by scripts/build-lesson-summaries.mjs.
//
// Loaded on demand: the file is small, but there's no reason for it to
// ride in the first bundle of a page that may never scroll that far.

let table: Promise<Record<string, string>> | null = null;

export async function lessonSummary(vimeoId: string): Promise<string | null> {
  if (!table)
    table = import("@/data/lesson-summaries.json").then((m) => m.default as Record<string, string>);
  return (await table)[vimeoId] ?? null;
}
