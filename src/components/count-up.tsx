"use client";

import { useEffect, useRef, useState } from "react";

/** A number that counts up from 1 to its value the first time it comes
 *  into view - fast at first, easing into the last few, so the size of
 *  it is felt rather than just read. Without motion it is simply the
 *  number. */
export function CountUp({ to, ms = 1500, className = "" }: { to: number; ms?: number; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);
  useEffect(() => {
    const node = el.current;
    if (!node || to <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let started = false;
    // Held at 1 until it is seen, so the count is never missed. (After
    // mounting: the server renders the real number, for anyone without
    // script.)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setN(1);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          const eased = 1 - Math.pow(1 - t, 3);
          setN(Math.max(1, Math.round(1 + (to - 1) * eased)));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, ms]);
  return (
    <span ref={el} className={`tabular-nums ${className}`}>
      {n}
    </span>
  );
}
