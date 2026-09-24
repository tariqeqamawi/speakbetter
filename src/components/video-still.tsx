"use client";

import Image from "next/image";
import { useState } from "react";
import type { Category } from "@/data/categories";

// A frame captured from the middle of a video, where the coach is
// actually teaching - Vimeo's own thumbnails come from the opening
// title card. Falls back to the category color if a frame is missing.

export function VideoStill({
  vimeoId,
  accent,
  sizes = "(min-width: 640px) 176px, 128px",
}: {
  vimeoId: string | null;
  accent: Category;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  // No still, or the still would not load. The old fallback was a
  // flat wash of the colour with a play triangle on it, which on a
  // card the size of Next Up reads as a picture that failed rather
  // than as a picture. Every colour already has its own painting -
  // the same art the skills section uses - so a challenge with no
  // video of its own borrows the art of the colour it belongs to.
  // "Watch all the Confidence & Presence skills" is completed by
  // watching rather than recording and so has no film at all; it is
  // exactly the card this is for.
  if (!vimeoId || failed) {
    return (
      <span className="absolute inset-0 overflow-hidden">
        <Image
          src={`/cat-${accent.id}.png`}
          alt=""
          fill
          sizes={sizes}
          className="object-cover opacity-80"
        />
        <span className={`absolute inset-0 ${accent.bgClass} opacity-15`} />
      </span>
    );
  }

  return (
    <Image
      src={`/thumbs/${vimeoId}.jpg`}
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
