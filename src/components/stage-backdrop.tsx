"use client";

import { useEffect, useRef } from "react";

// The trophy room's stage, with the smoke moving in the spotlight.
//
// A still photograph of smoke is a picture of a room; smoke that drifts
// is a room somebody is standing in. So behind the trophy is a short
// loop of the same stage with only the haze moving - five seconds,
// rendered with the photograph as both its first and its last frame so
// the loop has no seam, and small enough not to weigh the page.
//
// HOW IT STAYS LIGHT. The photograph is the poster, so the first paint
// is the same instant image it always was. The video is not fetched
// until the stage is on screen, plays only while it is, and never at
// all for somebody who has asked for less motion - they keep the still,
// which is the same room.

export function StageBackdrop({ poster, video }: { poster: string; video: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.src) v.src = video;
        void v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
    io.observe(v);
    return () => io.disconnect();
  }, [video]);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full object-cover"
    />
  );
}
