"use client";

import { useEffect, useState } from "react";
import { lessonCues, type LessonCue } from "@/lib/lesson-cues";
import { ChevronDownIcon, CircleIcon } from "@/components/icons";
import { categoryById, type CategoryId } from "@/data/categories";

// The lesson's key ideas, under the video: not a transcript, the notes
// - the points the teacher makes, in order, each with the moment it
// lands. As the video plays the current point is lit and the ones
// behind it are filled, so a student can see where they are in the
// lesson's argument and what's still coming.
//
// The points come from the lesson's own cues (data/lesson-cues.json -
// the phrases that appear beside the teacher as he says them), thinned
// to the ones far enough apart to be separate ideas.

/** The lesson's points: its cues, at least this many seconds apart. */
const MIN_GAP = 14;
const MOST = 9;

export interface LessonNote {
  at: number;
  text: string;
}

function notesFrom(cues: LessonCue[]): LessonNote[] {
  if (cues.length === 0) return [];
  const out: LessonNote[] = [];
  for (const cue of cues) {
    const last = out[out.length - 1];
    if (last && cue.t - last.at < MIN_GAP) continue;
    out.push({ at: cue.t, text: cue.w });
  }
  // Too many points is a transcript again: keep an even spread.
  if (out.length <= MOST) return out;
  const step = out.length / MOST;
  return Array.from({ length: MOST }, (_, i) => out[Math.floor(i * step)]);
}

function clock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export function LessonNotes({
  vimeoId,
  category,
  seconds,
  onSeek,
}: {
  vimeoId: string;
  category: CategoryId;
  /** Where the video is, so the notes can keep up with it. */
  seconds: number;
  /** Tapping a point jumps the video to it, where the player allows. */
  onSeek?: (seconds: number) => void;
}) {
  // The cues table is a few hundred KB, so it loads on demand - the
  // notes appear a moment after the player does.
  const [notes, setNotes] = useState<LessonNote[]>([]);
  useEffect(() => {
    let alive = true;
    lessonCues(vimeoId).then((cues) => {
      if (alive) setNotes(notesFrom(cues));
    });
    return () => {
      alive = false;
    };
  }, [vimeoId]);
  const [open, setOpen] = useState(true);
  if (notes.length === 0) return null;
  const cat = categoryById.get(category);
  const current = notes.reduce((found, n, i) => (seconds >= n.at - 0.4 ? i : found), -1);

  return (
    <section className={`overflow-hidden rounded-xl border border-navy-600 bg-navy-800 ${cat?.textClass ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-navy-700/40"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-ink">The key ideas</span>
          <span className="text-xs text-ink-faint">
            {notes.length} points · {current >= 0 ? `on point ${current + 1}` : "follows the video as it plays"}
          </span>
        </span>
        <span className="text-xs font-semibold tabular-nums">
          {Math.max(0, current + 1)}/{notes.length}
        </span>
        <ChevronDownIcon className={`size-4 shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <ol className="flex flex-col px-4 pb-4">
            {notes.map((note, i) => {
              const passed = i < current;
              const now = i === current;
              return (
                <li key={`${note.at}-${i}`} className="flex gap-3">
                  {/* The spine: a filled circle for a point already
                      made, a lit one for the point being made now. */}
                  <span className="flex shrink-0 flex-col items-center">
                    <span
                      className={`relative grid size-5 place-items-center rounded-full border transition-colors ${
                        now
                          ? "border-current bg-current text-navy-950 shadow-[0_0_14px_-2px_currentColor]"
                          : passed
                            ? "border-current bg-current/30 text-current"
                            : "border-navy-600 text-navy-600"
                      }`}
                    >
                      {now ? <span className="size-2 rounded-full bg-navy-950" /> : <CircleIcon className="size-2.5" />}
                    </span>
                    {i < notes.length - 1 && (
                      <span className={`w-px flex-1 ${passed || now ? "bg-current opacity-60" : "bg-navy-600"}`} />
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSeek?.(note.at)}
                    disabled={!onSeek}
                    className={`flex flex-1 items-baseline gap-2 pb-3 pt-0.5 text-left text-sm transition-colors disabled:cursor-default ${
                      now ? "font-semibold text-ink" : passed ? "text-ink-muted" : "text-ink-faint"
                    }`}
                  >
                    <span className="min-w-0 flex-1">{note.text}</span>
                    <span className="shrink-0 text-[0.65rem] tabular-nums text-ink-faint">{clock(note.at)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
