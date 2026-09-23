"use client";

import { useEffect, useState } from "react";
import { lessonSummary } from "@/lib/lesson-summaries";

// What the lesson is about, in two or three sentences, under the video
// - so a student can decide whether to watch it, or remember what it
// said afterwards, without reading a transcript or a list of points.

export function LessonSummary({ vimeoId }: { vimeoId: string }) {
  const [got, setGot] = useState<{ id: string; text: string | null }>({ id: "", text: null });
  const text = got.id === vimeoId ? got.text : null;

  useEffect(() => {
    let alive = true;
    lessonSummary(vimeoId).then((summary) => {
      if (alive) setGot({ id: vimeoId, text: summary });
    });
    return () => {
      alive = false;
    };
  }, [vimeoId]);

  if (!text) return null;
  return (
    <p className="rounded-xl border border-navy-600 bg-navy-800 p-4 text-sm leading-relaxed text-ink-muted">
      {text}
    </p>
  );
}
