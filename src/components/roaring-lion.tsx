"use client";

import { useEffect, useRef, useState } from "react";
import { LionMouth } from "@/components/lion-mouth";
import { isBare } from "@/components/bare-mode";

// The lion at the centre of a dial: at rest most of the time, and every
// so often it draws in and roars - the brand animation itself, scrubbed
// through the same frames the talking lion uses (lion-mouth.tsx), so
// nothing new is loaded to make it move. Not on a clock: the gap
// between roars varies, so it reads as the lion's own idea.

/** Seconds between roars, at least and at most. */
const REST_MIN = 5;
const REST_MAX = 10;
/** The roar's shape, milliseconds: draw in and open, hold, settle. */
const OPEN_MS = 520;
const HOLD_MS = 380;
const CLOSE_MS = 640;

export function RoaringLion({ className = "" }: { className?: string }) {
  const [level, setLevel] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || isBare()) return;
    let alive = true;
    let timer: number;
    const roar = () => {
      if (!alive) return;
      const t0 = performance.now();
      const tick = () => {
        if (!alive) return;
        const t = performance.now() - t0;
        let v: number;
        if (t < OPEN_MS) v = easeOut(t / OPEN_MS);
        else if (t < OPEN_MS + HOLD_MS) v = 1;
        else if (t < OPEN_MS + HOLD_MS + CLOSE_MS) v = 1 - easeInOut((t - OPEN_MS - HOLD_MS) / CLOSE_MS);
        else {
          setLevel(0);
          timer = window.setTimeout(roar, (REST_MIN + Math.random() * (REST_MAX - REST_MIN)) * 1000);
          return;
        }
        setLevel(v);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    };
    timer = window.setTimeout(roar, (2 + Math.random() * 3) * 1000);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <LionMouth level={level} roar className={className} />;
}

function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOut(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
