"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Neon confetti for a pass: a burst in the seven colors that falls,
// tumbles and settles, and moves away from a finger or a mouse drawn
// through it - so it's something to play with for the few seconds it
// lasts, not a canned clip. Drawn on one canvas; nothing in the DOM.

const COLORS = [
  "var(--color-storytelling)",
  "var(--color-figurative)",
  "var(--color-acting)",
  "var(--color-structure)",
  "var(--color-mindset)",
  "var(--color-body-language)",
  "var(--color-advanced)",
];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  born: number;
}

export function Confetti({ count = 320, duration = 7000 }: { count?: number; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Drawn at the body's level, above whatever opened it - a blurred
  // dialog makes its own stacking context and would keep it inside.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setHost(document.body), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    // The palette, resolved to real colors once.
    const probe = document.createElement("span");
    document.body.appendChild(probe);
    const colors = COLORS.map((c) => {
      probe.style.color = c;
      return getComputedStyle(probe).color;
    });
    probe.remove();

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;
    const t0 = performance.now();
    const pieces: Piece[] = [];
    // Two bursts from the lower corners, arcing up and in, and a
    // shower from the top - the room's worth of it.
    const burst = (x: number, y: number, n: number, dir: number, delay: number) => {
      for (let i = 0; i < n; i++) {
        const angle = (-Math.PI / 2 + dir * (Math.PI / 5)) + (Math.random() - 0.5) * (Math.PI / 2.4);
        const speed = 9 + Math.random() * 9;
        pieces.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 8 + Math.random() * 7,
          h: 4 + Math.random() * 6,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.35,
          color: colors[i % colors.length],
          born: t0 + delay,
        });
      }
    };
    burst(0, H() * 0.7, Math.round(count * 0.35), 1, 0);
    burst(W(), H() * 0.7, Math.round(count * 0.35), -1, 60);
    // The shower from the top keeps coming for the first three seconds.
    for (let i = 0; i < Math.round(count * 0.6); i++) {
      pieces.push({
        x: Math.random() * W(), y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2,
        w: 8 + Math.random() * 7, h: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length], born: t0 + 200 + Math.random() * 4500,
      });
    }

    // A finger or mouse drawn through the fall pushes the pieces away.
    let px = -1e4, py = -1e4;
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; };
    const onLeave = () => { px = -1e4; py = -1e4; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onLeave, { passive: true });

    let raf = 0;
    const tick = (now: number) => {
      const age = now - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W(), H());
      const fade = age > duration - 900 ? Math.max(0, (duration - age) / 900) : 1;
      for (const p of pieces) {
        if (now < p.born) continue;
        // Light gravity, and paper's drag: a piece never falls faster
        // than a flutter, so the fall lasts the whole run.
        p.vy += 0.14;
        p.vx *= 0.985;
        if (p.vy > 3.2) p.vy = 3.2 + (p.vy - 3.2) * 0.86;
        p.vx += Math.sin((now + p.born) / 300 + p.rot) * 0.12; // the wobble
        const dx = p.x - px, dy = p.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) {       // the pointer's push
          const d = Math.sqrt(d2) || 1;
          const f = (140 - d) / 140 * 2.4;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > H() + 20) continue;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        // a strip seen edge-on as it tumbles
        ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.cos(p.rot * 1.7), p.w, p.h * Math.abs(Math.cos(p.rot * 1.7)) + 1);
        ctx.restore();
      }
      if (age < duration) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W(), H());
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onLeave);
    };
  }, [count, duration, host]);

  if (!host) return null;
  return createPortal(
    <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[80]" />,
    host,
  );
}
