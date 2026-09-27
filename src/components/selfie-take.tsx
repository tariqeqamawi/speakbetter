"use client";

import { useEffect, useRef, useState } from "react";
import type { SelfieTakeClip } from "@/data/selfie-takes";

// Somebody recording a take, the way a student actually does it: the
// phone's own camera, a ring light, and the app's recording screen over
// it - the red dot and the running time at the top, the challenge's
// brief and the lines that complete it at the foot, ticking as the take
// goes on, so they can glance at them while they speak.
//
// The people are rendered (public/selfie, made with Higgsfield); the
// screen over them is drawn here, so its words are the app's words and
// stay sharp at any size.


export function SelfieTake({ take, className = "" }: { take: SelfieTakeClip; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [secs, setSecs] = useState(0);
  // Play only while on screen, and count the take's time while it does.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      threshold: 0.3,
    });
    io.observe(v);
    const t = setInterval(() => {
      if (!v.paused) setSecs((s) => (s + 1) % 90);
    }, 1000);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className={`relative aspect-[9/16] overflow-hidden rounded-[1.8rem] bg-navy-950 ${className}`}>
      <video
        ref={video}
        src={`${take.src}.mp4`}
        poster={`${take.src}.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
        className="absolute inset-0 size-full object-cover"
      />
      {/* The recording screen, over the camera. */}
      <span className="absolute inset-x-0 top-0 flex items-center justify-center bg-gradient-to-b from-black/55 to-transparent pb-6 pt-3">
        <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[0.65rem] font-bold tabular-nums text-white backdrop-blur">
          <span className="size-2 animate-pulse rounded-full bg-[#ff3b30]" />
          REC {mm}:{ss}
        </span>
      </span>
      {/* As the app's recorder shows it: the brief, and the lines that
          complete it - each one ticking as the take goes on. */}
      <span className="absolute inset-x-2 bottom-2 flex flex-col gap-1 rounded-xl bg-black/55 px-2.5 py-2 text-left backdrop-blur">
        <span className="block text-[0.5rem] font-bold uppercase tracking-wider text-storytelling">The brief</span>
        <span className="block text-[0.62rem] font-semibold leading-snug text-white">{take.brief}</span>
        {take.criteria.length > 0 && (
          <>
            <span className="mt-0.5 flex items-center justify-between text-[0.45rem] font-bold uppercase tracking-wider text-white/60">
              Complete the challenge by
              <span className="tabular-nums">
                {take.criteria.filter((_, i) => secs >= (i + 1) * 9).length}/{take.criteria.length}
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              {take.criteria.map((c, i) => {
                const met = secs >= (i + 1) * 9;
                return (
                  <span key={c} className="flex items-start gap-1.5 text-[0.55rem] leading-tight text-white/90">
                    <span
                      className={`mt-px grid size-2.5 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${
                        met ? "border-mindset bg-mindset shadow-[0_0_6px_var(--color-mindset)]" : "border-white/40"
                      }`}
                    />
                    {c}
                  </span>
                );
              })}
            </span>
          </>
        )}
      </span>
    </div>
  );
}
