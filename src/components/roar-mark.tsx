"use client";

import { useEffect, useState } from "react";

// The brand mark, roaring. public/lion-roar.webp is the brand clip
// (SpeakBetter1.mov, 2.5 s) as an animated WebP - lion and mic only,
// the wave cleared so the hero's live wave stands in for it - with a
// long hold on the resting frame, so the roar comes round about every
// ten seconds and the mark is otherwise the mark. Built by
// scratchpad/build-roar.py from the MOV's frames.
//
// The still (77 KB) paints first and is the page's largest element;
// the animation (640 KB) is fetched behind it and swapped in once it's
// here, and never for anyone who asked for less motion.

const STILL = "/lion-roar-still.png";
const ROAR = "/lion-roar.webp";
export const ROAR_W = 448;
export const ROAR_H = 332;

export function RoarMark({ className = "" }: { className?: string }) {
  const [src, setSrc] = useState(STILL);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const img = new Image();
    img.onload = () => setSrc(ROAR);
    img.src = ROAR;
    return () => {
      img.onload = null;
    };
  }, []);
  // An animated WebP; next/image would re-encode it to a single frame.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Speak Better" width={ROAR_W} height={ROAR_H} fetchPriority="high" className={className} />
  );
}
