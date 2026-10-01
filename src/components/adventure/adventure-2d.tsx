"use client";

import { LockIcon } from "./lock-icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { WorldPhase, WorldStop } from "./adventure-world";

// The same road, flat: for anybody who would rather scroll a page than
// travel a world. Bottom to top - the way the road runs away from you in
// 3D and 4D - challenge 1 at the foot and the finish at the top, on a gently winding
// lit path - each phase opening with its letter and name, each
// challenge a numbered stop with its name beside it. Everything the 3D
// road offers that matters is here too: which one you are on, Start on
// that one, Replay on the ones behind you, locked on the ones ahead.

/** Height of a row, of a phase heading, and how far the path swings. */
const ROW = 118;
/** The picture for a challenge with no video (live-adventure.tsx). */
const LION = "/logo-mark.png";

/** Zoomed in: much more road between one challenge and the next, and room
 *  for each one's picture. */
const ROW_ZOOMED = 300;
const HEAD = 64;
const SWING = 0.26;
/** Room at the top for the finish. */
const FINISH = 96;

export function Adventure2D({
  stops,
  phases,
  scrollRoot,
  zoomed = false,
}: {
  stops: WorldStop[];
  phases: WorldPhase[];
  /** Zoomed in (the magnifying glass): the map stretched out, a picture
   *  for each challenge. */
  zoomed?: boolean;
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
  // Open on the one the student is on - or, with none open, at the
  // start, down at the foot of the map.
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = list.current?.lastElementChild as HTMLElement | null;
    centre(here.current ?? (list.current?.querySelector("[data-first]") as HTMLElement | null) ?? el);
    // Once, on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Tap a challenge not yet open: told so, and taken back to the one
  // you are on.
  const [notice, setNotice] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const router = useRouter();
  const backToCurrent = () => {
    setNotice(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      centre(here.current, true);
      timer.current = setTimeout(() => setNotice(false), 1800);
    }, 1200);
  };

  // THE ZOOM, eased from one to the other over half a second - the map
  // stretching or closing up - with the challenge you're on held still on
  // the screen while it does.
  const [z, setZ] = useState(zoomed ? 1 : 0);
  const anchorTop = useRef<number | null>(null);
  const anchor = () => (here.current ?? (list.current?.querySelector("[data-first]") as HTMLElement | null));
  useEffect(() => {
    const target = zoomed ? 1 : 0;
    const from = z;
    if (from === target) return;
    anchorTop.current = anchor()?.getBoundingClientRect().top ?? null;
    const t0 = performance.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 500);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setZ(from + (target - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else anchorTop.current = null;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // (Starts from wherever it has got to.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomed]);
  useLayoutEffect(() => {
    const was = anchorTop.current;
    const el = anchor();
    if (was === null || !el) return;
    const drift = el.getBoundingClientRect().top - was;
    const root = scrollRoot?.current;
    if (root) root.scrollBy(0, drift);
    else window.scrollBy(0, drift);
  });
  const row = ROW + (ROW_ZOOMED - ROW) * z;

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
    centres.push({ x: 0.5 + Math.sin(i * 0.9) * SWING, y: y + row / 2 });
    y += row;
  });
  // Then turned upside down, so the journey climbs the page: the first
  // challenge at the bottom, each phase's heading at its foot, and on up
  // to the finish.
  const height = y + FINISH;
  for (const h of heads) h.top = height - h.top - HEAD;
  for (const c of centres) c.y = height - c.y;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-4">
      <ol ref={list} className="relative" style={{ height }}>
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

        {/* The finish, at the top of the climb. */}
        <li aria-hidden className="absolute inset-x-0 top-2 flex flex-col items-center gap-1">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-ink-faint">Finish</span>
          <span className="text-3xl" style={{ filter: "drop-shadow(0 0 12px #f5a524)" }}>
            🦁
          </span>
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
              data-first={i === 0 ? "" : undefined}
              className={`absolute flex gap-3 ${z > 0.02 ? "items-start" : "items-center"}`}
              style={{
                top: cy - 28,
                ...(left ? { left: `calc(${x * 100}% - 28px)` } : { right: `calc(${(1 - x) * 100}% - 28px)` }),
                flexDirection: left ? "row" : "row-reverse",
              }}
            >
              {/* The number, the thumbnail and the name are all ways in -
                  to the challenge you're on, or to replay one you've
                  passed. Only a locked one says so instead. */}
              <span
                onClick={locked ? backToCurrent : () => router.push(`/challenges/${stop.slug}`)}
                role={locked ? undefined : "link"}
                aria-label={locked ? undefined : `${done ? "Replay" : "Open"} ${stop.title}`}
                className={`grid size-14 shrink-0 cursor-pointer place-items-center rounded-full border-[3px] text-xl font-extrabold ${on ? "animate-pulse" : ""}`}
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
                  onClick={locked ? backToCurrent : () => router.push(`/challenges/${stop.slug}`)}
                  className={`cursor-pointer text-sm font-semibold leading-tight text-balance ${locked ? "text-ink-faint" : "text-ink hover:underline"}`}
                >
                  {stop.title}
                </span>
                {/* Zoomed in: the challenge's picture. */}
                {z > 0.02 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stop.image}
                    alt=""
                    loading="lazy"
                    onClick={locked ? backToCurrent : () => router.push(`/challenges/${stop.slug}`)}
                    // A challenge with no video of its own shows the whole
                    // lion, on the app's navy glass - never cropped to a face.
                    // (The one you're on pulses white, like its number.)
                    className={`cursor-pointer rounded-lg border ${stop.image === LION ? "object-contain p-1.5" : "object-cover"} ${on ? "thumb-pulse" : ""}`}
                    style={{
                      width: 128 * z,
                      height: 72 * z,
                      opacity: z * (locked ? 0.45 : 1),
                      borderColor: locked ? "#3a4260" : on ? "#ffffff" : c,
                      filter: locked ? "grayscale(0.7)" : undefined,
                      background:
                        stop.image === LION ? "radial-gradient(120% 90% at 30% 20%, #2a1b5c 0%, #0f1a3a 45%, #0a2a2e 100%)" : undefined,
                    }}
                  />
                )}
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
                    <LockIcon className="-mt-0.5 mr-1 size-3.5" />Locked
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
            <LockIcon className="-mt-0.5 mr-1.5 size-4" />Complete your current section to unlock this one.
          </p>
        </div>
      )}
    </div>
  );
}
