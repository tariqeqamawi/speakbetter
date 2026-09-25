"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Travel, layoutRoad } from "./road-geometry";
import type { WorldPhase, WorldStop } from "./adventure-world";

// The adventure screen: the 3D road filling the frame, and the few
// things laid over it - which phase you are in, which checkpoint you
// are nearest, and how to move.
//
// The world is loaded only on this screen and only in the browser: it
// is the one place the 3D engine is needed, so nobody pays for it on
// any other page.

const AdventureWorld = dynamic(() => import("./adventure-world").then((m) => m.AdventureWorld), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-ink-faint">Loading the road…</div>,
});

export function AdventureScreen({ stops, phases }: { stops: WorldStop[]; phases: WorldPhase[] }) {
  const road = useMemo(() => layoutRoad(stops.length), [stops.length]);
  // Start a little before the checkpoint the student is on.
  const hereIndex = Math.max(0, stops.findIndex((s) => s.state === "here"));
  const start = Math.max(0, road.stops[hereIndex] - 24);
  const [travel] = useState(() => new Travel(start));
  const [s, setS] = useState(start);
  const frame = useRef<HTMLDivElement>(null);

  const onMove = useCallback((next: number) => setS(next), []);

  // Drag down (or scroll down) to go forward, with momentum.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let lastY: number | null = null;
    const down = (e: PointerEvent) => {
      lastY = e.clientY;
      travel.push(0, 0);
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (lastY === null) return;
      const dy = e.clientY - lastY;
      lastY = e.clientY;
      travel.push(dy * 0.045, 0.5);
    };
    const up = () => {
      lastY = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      travel.push(e.deltaY * 0.0045);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        travel.push(e.key === "ArrowDown" ? 0.9 : -0.9);
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("keydown", key);
    };
  }, [travel]);

  // Which checkpoint is nearest, and which phase that puts you in.
  const nearest = road.stops.reduce((best, at, i) => (Math.abs(at - s) < Math.abs(road.stops[best] - s) ? i : best), 0);
  const stop = stops[nearest];
  const phase = phases.find((p) => p.id === stop?.phase);
  const atFinish = s > road.finish - 20;

  return (
    <div
      ref={frame}
      tabIndex={0}
      role="application"
      aria-label="The S.T.O.R.Y. road. Drag down or use the down arrow to travel forward."
      className="relative h-[calc(100dvh-4rem)] w-full touch-none select-none overflow-hidden bg-[#070c18] outline-none"
    >
      <AdventureWorld stops={stops} phases={phases} travel={travel} onMove={onMove} />

      {/* Where you are. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 bg-gradient-to-b from-[#070c18]/90 to-transparent px-4 pb-10 pt-4 text-center">
        {phase && (
          <>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em]" style={{ color: phase.color }}>
              Phase {phase.id}
            </span>
            <span className="text-lg font-bold tracking-tight text-ink">{phase.name}</span>
          </>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-[#070c18]/95 to-transparent px-4 pb-6 pt-16 text-center">
        {atFinish ? (
          <span className="text-lg font-bold text-ink">The finish line</span>
        ) : (
          stop && (
            <>
              <span className="text-xs tabular-nums text-ink-faint">
                Challenge {nearest + 1} of {stops.length}
              </span>
              <span className="max-w-sm text-base font-semibold text-ink text-balance">{stop.title}</span>
            </>
          )
        )}
        <span className="mt-2 text-[0.7rem] text-ink-faint">Drag down to travel forward</span>
      </div>
    </div>
  );
}
