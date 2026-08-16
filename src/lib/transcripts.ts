// Server-only access to lesson transcripts (master plan §08).
// The JSON is large (~550 KB) - import it only from server components
// so it never enters the client bundle. This is the AI coach's future
// reference layer; for now it powers the transcript panel on lesson pages.

import transcriptsJson from "@/data/transcripts.json";

interface TranscriptEntry {
  id: string;
  title: string;
  url: string;
  text: string;
}

const byId = new Map(
  (transcriptsJson as TranscriptEntry[]).map((t) => [t.id, t]),
);

export function getTranscript(vimeoId: string): string | undefined {
  const text = byId.get(vimeoId)?.text?.trim();
  return text && text.length > 0 ? text : undefined;
}
