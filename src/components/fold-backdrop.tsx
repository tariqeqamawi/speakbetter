"use client";

import { useEffect, useRef } from "react";

// A film playing very faintly behind a fold - moments of people talking
// to a phone, a ring light, a podcast mic - texture, not content. Dim,
// soft and feathered into the page at every edge, so the words over it
// stay the thing to read. Laptop only (on a phone it would be data spent
// on something nobody could make out), never for anyone who asked for
// less motion, and it plays only while the fold is on screen.

export function FoldBackdrop({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.src) v.src = src;
        v.play().catch(() => {});
      } else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden lg:block"
      style={{
        maskImage:
          "radial-gradient(75% 70% at 50% 50%, #000 30%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(75% 70% at 50% 50%, #000 30%, transparent 100%)",
      }}
    >
      <video
        ref={ref}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        className="size-full object-cover opacity-[0.13] blur-[2px] saturate-[0.7]"
      />
    </div>
  );
}
