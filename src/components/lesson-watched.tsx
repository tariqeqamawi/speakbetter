"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

// Marks a lesson as watched a few seconds after the page opens - long
// enough to mean the student actually engaged, without needing a button.
export function LessonWatched({ vimeoId }: { vimeoId: string }) {
  const { markLessonWatched, ready } = useStore();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => markLessonWatched(vimeoId), 5000);
    return () => clearTimeout(t);
  }, [ready, vimeoId, markLessonWatched]);

  return null;
}
