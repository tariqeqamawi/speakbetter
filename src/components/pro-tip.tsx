"use client";

import { useEffect, useState } from "react";
import { proTips } from "@/data/pro-tips";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById } from "@/data/categories";
import { ZapIcon } from "@/components/icons";

// One idea from the library, sitting next to the student's reason for
// being here — the why beside a what to do about it. It changes every
// few minutes so the dashboard is never quite the same twice, and names
// the lesson it came from so a tip that lands leads somewhere.

const ROTATE_MS = 5 * 60 * 1000;

export function ProTip() {
  // Chosen after mount: picking randomly during render would disagree
  // with the server's markup.
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const pick = () => setIndex(Math.floor(Math.random() * proTips.length));
    pick();
    const timer = setInterval(pick, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  if (index === null) return null;

  const tip = proTips[index];
  const lesson = lessonByVimeoId.get(tip.vimeoId);
  const category = lesson ? categoryById.get(lesson.category) : undefined;

  return (
    <div
      // Keyed by tip so each new one fades in rather than swapping.
      key={tip.vimeoId}
      className="coach-cue flex flex-col gap-1.5 rounded-xl border border-navy-600 bg-navy-900/60 p-4"
    >
      <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
        <ZapIcon className={`size-3.5 ${category?.textClass ?? "text-ink-faint"}`} />
        Pro tip
      </span>
      <p className="text-sm leading-relaxed text-ink-muted">{tip.tip}</p>
      {lesson && (
        <span className="flex items-center gap-1.5 text-[0.7rem] text-ink-faint">
          <span className={`size-1.5 rounded-full ${category?.bgClass ?? ""}`} />
          From the lesson &ldquo;{lesson.title}&rdquo;
        </span>
      )}
    </div>
  );
}
