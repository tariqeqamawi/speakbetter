"use client";

import { useEffect, useRef } from "react";

// Coach in the sky over the road: a head that fades in when he has
// something to say, talks, and fades away once he has said it. Drawn over
// the world rather than in it, so he holds perfectly still - no swaying
// with the camera, no growing or shrinking, no bobbing - wherever the
// traveller goes while he talks. His mouth is the same 28 frames the
// lion talks with everywhere else in the app (public/lion-mouth.webp,
// stacked top to bottom).

const FRAMES = 28;

export function SkyCoach({ talking }: { talking: boolean }) {
  const face = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!talking) {
      if (face.current) face.current.style.backgroundPositionY = "0%";
      return;
    }
    // Open on a syllable, shut between them - about two opens a second
    // with a little randomness, never the same shape twice.
    let raf = 0;
    let frame = 0;
    let target = 0;
    let next = 0;
    let open = false;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (now > next) {
        open = !open;
        target = open ? 8 + Math.random() * 13 : Math.random() * 3;
        next = now + (open ? 160 + Math.random() * 140 : 70 + Math.random() * 60);
      }
      frame += (target - frame) * Math.min(1, dt * 22);
      const f = Math.round(Math.min(FRAMES - 1, Math.max(0, frame)));
      if (face.current) face.current.style.backgroundPositionY = `${(f / (FRAMES - 1)) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [talking]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-[14%] z-10 flex justify-center transition-opacity ease-out"
      style={{ opacity: talking ? 1 : 0, transitionDuration: talking ? "450ms" : "1100ms" }}
    >
      <div className="relative h-[clamp(76px,13vh,124px)] aspect-[1.28]">
        {/* A soft warm glow behind him. */}
        <div
          className="absolute inset-[-35%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,154,60,0.28), rgba(255,154,60,0) 62%)" }}
        />
        <div
          ref={face}
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/lion-mouth.webp)",
            backgroundSize: `100% ${FRAMES * 100}%`,
            backgroundPositionX: "0%",
            backgroundPositionY: "0%",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    </div>
  );
}
