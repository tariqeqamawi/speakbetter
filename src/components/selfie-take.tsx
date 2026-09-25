"use client";

import { useEffect, useRef, useState } from "react";
import type { SelfieTakeClip } from "@/data/selfie-takes";

// Somebody recording a take, the way a student actually does it: the
// phone's own camera, a ring light, and the app's recording screen over
// it - the red dot and the running time at the top, the challenge's
// brief at the foot so they can glance at it while they speak.
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
      <span className="absolute inset-x-2 bottom-2 rounded-xl bg-black/50 px-2.5 py-2 text-left backdrop-blur">
        <span className="block text-[0.5rem] font-bold uppercase tracking-wider text-storytelling">The brief</span>
        <span className="block text-[0.65rem] font-semibold leading-snug text-white">{take.brief}</span>
      </span>
    </div>
  );
}
