"use client";

import { useEffect, useRef } from "react";

// A thin trail of neon behind the mouse - the spectrum's colours running
// along it, fading out within half a second. Subtle on purpose: a line
// of light, not a spray. Only for a mouse (a finger has no cursor to
// follow), never for anyone who asked for less motion, and it draws only
// while the pointer moves - at rest it costs nothing. It never takes a
// click: the canvas lets every pointer through.

const LIFE = 380; // ms a point of the trail lasts
const COLORS = ["#ffd60a", "#ff9500", "#ff4a2b", "#d11149", "#f53de0", "#4d6bff", "#22d9f5", "#1fe890"].map((h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);

/** A colour part-way along the spectrum (wrapping round), blended. */
function mix(at: number): string {
  const n = COLORS.length;
  const f = ((at % n) + n) % n;
  const a = COLORS[Math.floor(f)];
  const b = COLORS[(Math.floor(f) + 1) % n];
  const t = f - Math.floor(f);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function NeonTracer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    size();
    window.addEventListener("resize", size);

    const pts: { x: number; y: number; t: number }[] = [];
    let raf = 0;
    let hue = 0; // where along the spectrum the trail's head is

    const draw = () => {
      const now = performance.now();
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "lighter";
      // Soft, like the waveform: two passes of a smoothed ribbon - a wide
      // faint haze and a narrower glow - no hard core, the colours
      // shading into each other along it.
      for (const [width, alpha, blur] of [
        [13, 0.05, 20],
        [4.5, 0.12, 11],
      ] as const) {
        for (let i = 2; i < pts.length; i++) {
          const p0 = pts[i - 2];
          const p1 = pts[i - 1];
          const p2 = pts[i];
          const life = 1 - (now - p2.t) / LIFE;
          const k = i / pts.length;
          const color = mix(hue + i / 6);
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = blur;
          // Tapered: full width at the cursor, narrowing to nothing at
          // the tail.
          ctx.globalAlpha = alpha * life * Math.pow(k, 1.3);
          ctx.lineWidth = width * Math.pow(k, 1.6);
          ctx.beginPath();
          // Through the midpoints: a curve, not a chain of segments.
          ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
          ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          ctx.stroke();
        }
      }
      if (pts.length > 2) raf = requestAnimationFrame(draw);
      else {
        raf = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (pts.length > 60) pts.shift();
      hue = (hue + 0.04) % COLORS.length;
      if (!raf) raf = requestAnimationFrame(draw);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", size);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
