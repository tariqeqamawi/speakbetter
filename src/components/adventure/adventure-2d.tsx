"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { WorldPhase, WorldStop } from "./adventure-world";

// The same road, flat: for anybody who would rather scroll a page than
// travel a world. Top to bottom, challenge 1 to 24, on a gently winding
// lit path - each phase opening with its letter and name, each
// challenge a numbered stop with its name beside it. Everything the 3D
// road offers that matters is here too: which one you are on, Start on
// that one, Replay on the ones behind you, locked on the ones ahead.

/** Height of a row, of a phase heading, and how far the path swings. */
const ROW = 118;
const HEAD = 64;
const SWING = 0.26;

export function Adventure2D({
  stops,
  phases,
  scrollRoot,
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  /** When the map sits inside a scrolling frame (the landing page's
   *  phone), scroll that rather than the page. */
  scrollRoot?: React.RefObject<HTMLElement | null>;
}) {
  const here = useRef<HTMLLIElement>(null);
  const centre = (el: HTMLElement | null, smooth = false) => {
    if (!el) return;
    const root = scrollRoot?.current;
    if (!root) return el.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({ top: top - root.clientHeight / 2 + el.clientHeight / 2, behavior: smooth ? "smooth" : "auto" });
  };
  // Open on the one the student is on.
  useEffect(() => {
    centre(here.current);
    // Once, on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Tap a challenge not yet open: told so, and taken back to the one
  // you are on.
  const [notice, setNotice] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const backToCurrent = () => {
    setNotice(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      centre(here.current, true);
      timer.current = setTimeout(() => setNotice(false), 1800);
    }, 1200);
  };

  const colour = new Map(phases.map((p) => [p.id, p.color]));

  // Lay everything out once: where each heading goes, and each stop's
  // centre - across as a share of the width, down in pixels.
  const heads: { phase: string; top: number }[] = [];
  const centres: { x: number; y: number }[] = [];
  let y = 0;
  stops.forEach((stop, i) => {
    if (i === 0 || stops[i - 1].phase !== stop.phase) {
      heads.push({ phase: stop.phase, top: y });
      y += HEAD;
    }
    centres.push({ x: 0.5 + Math.sin(i * 0.9) * SWING, y: y + ROW / 2 });
    y += ROW;
  });
  const height = y;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-4">
      <ol className="relative" style={{ height }}>
        {/* The path, behind everything: lit and solid where it has been
            walked, a faint dashed line where it has not. */}
        <li aria-hidden className="pointer-events-none absolute inset-0">
          <svg className="h-full w-full overflow-visible" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
            {centres.slice(0, -1).map((a, i) => {
              const b = centres[i + 1];
              const my = (a.y + b.y) / 2;
              const c = colour.get(stops[i + 1].phase) ?? "#fff";
              const walked = stops[i + 1].state === "done" || stops[i + 1].state === "here";
              return (
                <path
                  key={i}
                  d={`M ${a.x * 100} ${a.y} C ${a.x * 100} ${my}, ${b.x * 100} ${my}, ${b.x * 100} ${b.y}`}
                  fill="none"
                  stroke={c}
                  strokeWidth={walked ? 3 : 1.5}
                  strokeOpacity={walked ? 0.95 : 0.35}
                  strokeDasharray={walked ? undefined : "4 6"}
                  vectorEffect="non-scaling-stroke"
                  style={walked ? { filter: `drop-shadow(0 0 4px ${c})` } : undefined}
                />
              );
            })}
          </svg>
        </li>

        {heads.map((h) => {
          const c = colour.get(h.phase) ?? "#fff";
          const ph = phases.find((p) => p.id === h.phase);
          return (
            <li key={`h-${h.phase}`} data-phase={h.phase} className="absolute inset-x-0 flex items-center gap-3" style={{ top: h.top + 8 }}>
              <span
                className="grid size-11 place-items-center rounded-xl border-2 bg-navy-950 text-xl font-extrabold"
                style={{ borderColor: c, color: c, boxShadow: `0 0 18px -4px ${c}` }}
              >
                {h.phase}
              </span>
              <span className="text-lg font-bold tracking-tight text-ink">{ph?.name}</span>
              <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${c}, transparent)` }} />
            </li>
          );
        })}

        {stops.map((stop, i) => {
          const { x, y: cy } = centres[i];
          const c = colour.get(stop.phase) ?? "#fff";
          const on = stop.state === "here";
          const done = stop.state === "done";
          const locked = stop.state === "locked" || stop.state === "ahead";
          // Words on whichever side has the room.
          const left = x < 0.5;
          return (
            <li
              key={stop.slug}
              ref={on ? here : undefined}
              className="absolute flex items-center gap-3"
              style={{
                top: cy - 28,
                ...(left ? { left: `calc(${x * 100}% - 28px)` } : { right: `calc(${(1 - x) * 100}% - 28px)` }),
                flexDirection: left ? "row" : "row-reverse",
              }}
            >
              <span
                onClick={locked ? backToCurrent : undefined}
                className={`grid size-14 shrink-0 place-items-center rounded-full border-[3px] text-xl font-extrabold ${on ? "animate-pulse" : ""} ${locked ? "cursor-pointer" : ""}`}
                style={{
                  borderColor: locked ? "#3a4260" : on ? "#ffffff" : c,
                  color: locked ? "#5a6282" : "#ffffff",
                  background: locked ? "#0a1022" : `radial-gradient(circle, ${c}55, #070c18 70%)`,
                  boxShadow: locked ? undefined : `0 0 ${on ? 26 : 14}px -2px ${c}`,
                }}
              >
                {i + 1}
              </span>
              <span className={`flex max-w-[11rem] flex-col gap-1 ${left ? "items-start text-left" : "items-end text-right"}`}>
                <span
                  onClick={locked ? backToCurrent : undefined}
                  className={`text-sm font-semibold leading-tight text-balance ${locked ? "cursor-pointer text-ink-faint" : "text-ink"}`}
                >
                  {stop.title}
                </span>
                {done && stop.score !== undefined && (
                  <span className="text-xs font-bold" style={{ color: c }}>
                    Passed · {stop.score}
                  </span>
                )}
                {on && (
                  <Link
                    href={`/challenges/${stop.slug}`}
                    className="rounded-full px-4 py-1.5 text-xs font-bold text-navy-950"
                    style={{ background: c, boxShadow: `0 0 16px ${c}` }}
                  >
                    Start challenge
                  </Link>
                )}
                {done && (
                  <Link
                    href={`/challenges/${stop.slug}`}
                    className="text-xs font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    Replay challenge
                  </Link>
                )}
                {locked && (
                  <button type="button" onClick={backToCurrent} className="text-xs text-ink-faint hover:text-ink-muted">
                    🔒 Complete your current section first
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {notice && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-1/2 z-50 flex justify-center px-6">
          <p className="coach-note-in rounded-2xl border border-navy-500 bg-navy-950/95 px-5 py-3 text-center text-sm font-semibold text-ink shadow-2xl backdrop-blur">
            🔒 Complete your current section to unlock this one.
          </p>
        </div>
      )}
    </div>
  );
}
