"use client";

import { useStore } from "@/lib/store";

export function WatchedIndicator({ vimeoId }: { vimeoId: string }) {
  const { state, ready } = useStore();
  if (!ready || !state.watchedLessons.includes(vimeoId)) return null;
  return (
    <span className="shrink-0 rounded-full bg-navy-700 px-2 py-0.5 text-[0.65rem] font-medium text-mindset">
      Watched
    </span>
  );
}
