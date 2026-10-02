"use client";

import { useEffect, useRef } from "react";

// A thin trail of neon behind the mouse - the spectrum's colours running
// along it, fading out within half a second. Subtle on purpose: a line
// of light, not a spray. Only for a mouse (a finger has no cursor to
// follow), never for anyone who asked for less motion, and it draws only
// while the pointer moves - at rest it costs nothing. It never takes a
// click: the canvas lets every pointer through.

const LIFE = 450; // ms a point of the trail lasts
const COLORS = ["#ffd60a", "#ff9500", "#ff4a2b", "#d11149", "#f53de0", "#4d6bff", "#22d9f5", "#1fe890"];

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
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const life = 1 - (now - b.t) / LIFE; // 1 new, 0 gone
        const k = i / pts.length; // 0 tail, 1 head
        const color = COLORS[Math.floor(hue + i / 3) % COLORS.length];
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.55 * life * k;
        ctx.lineWidth = 0.6 + 1.8 * k;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      if (pts.length > 1) raf = requestAnimationFrame(draw);
      else {
        raf = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (pts.length > 60) pts.shift();
      hue = (hue + 0.08) % COLORS.length;
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
