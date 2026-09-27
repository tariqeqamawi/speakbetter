"use client";

import { useEffect, useRef, useState } from "react";
import type { Travel } from "./road-geometry";

// A throttle for the 3D road, under the thumb in the bottom right - the
// other way to travel besides dragging the road itself.
//
// Hold the knob and push it up: forward, faster the higher you push.
// Bring it back toward the middle to slow; past the middle, down, and
// the road runs backwards. Let go and it springs back to the middle and
// the road coasts to a stop. The arrows at either end do the same when
// held - forward at a steady pace, or back.

const FULL = 0.85; // travel speed at the top of the dial, per 60th of a second
const DEAD = 0.1; // the still band around the middle

export function RoadDial({ travel, color = "#ffffff" }: { travel: Travel; color?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0); // -1 (back, full) .. 1 (forward, full)
  const held = useRef(0);

  // While held, keep the road moving at the dial's speed.
  useEffect(() => {
    let raf = 0;
    const run = () => {
      const p = held.current;
      if (Math.abs(p) > DEAD) {
        const k = (Math.abs(p) - DEAD) / (1 - DEAD);
        travel.target = null;
        travel.v = Math.sign(p) * k * k * FULL;
      }
      raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [travel]);

  const set = (p: number) => {
    held.current = p;
    setPos(p);
  };
  const fromPointer = (clientY: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    const mid = r.top + r.height / 2;
    set(Math.max(-1, Math.min(1, (mid - clientY) / (r.height / 2 - 14))));
  };

  return (
    <div
      data-road-control
      className="pointer-events-auto flex flex-col items-center gap-1 rounded-full border border-white/15 bg-navy-950/70 p-1 backdrop-blur"
      style={{ boxShadow: `0 0 16px -4px ${color}` }}
    >
      <button
        type="button"
        aria-label="Travel forward"
        className="grid size-8 place-items-center text-white/80"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          set(0.6);
        }}
        onPointerUp={() => set(0)}
        onPointerCancel={() => set(0)}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>
      <div
        ref={track}
        role="slider"
        aria-label="Speed along the road: up to go forward, down to go back"
        aria-valuemin={-100}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos * 100)}
        tabIndex={-1}
        className="relative h-24 w-8 touch-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientY);
        }}
        onPointerUp={() => set(0)}
        onPointerCancel={() => set(0)}
      >
        <span className="absolute inset-x-[0.9rem] inset-y-1 rounded-full bg-white/15" />
        <span className="absolute inset-x-2 top-1/2 h-px bg-white/30" />
        <span
          className={`absolute left-1/2 top-1/2 size-7 rounded-full border-2 border-white bg-white/25 ${
            pos === 0 ? "transition-transform duration-300 ease-out" : ""
          }`}
          style={{
            transform: `translate(-50%, calc(-50% - ${pos * 34}px))`,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
      <button
        type="button"
        aria-label="Travel back"
        className="grid size-8 place-items-center text-white/80"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          set(-0.6);
        }}
        onPointerUp={() => set(0)}
        onPointerCancel={() => set(0)}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
