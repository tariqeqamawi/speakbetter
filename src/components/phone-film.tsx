"use client";

import { useEffect, useRef } from "react";

// A film of the app playing inside a phone frame on the landing page,
// running only while it's on screen - a film costs almost nothing, a
// live page costs a page. Muted, looping, with a poster until it plays.

export function PhoneFilm({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.play().catch(() => {});
          else el.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      className="size-full object-cover"
    />
  );
}
