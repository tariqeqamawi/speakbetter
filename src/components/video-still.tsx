"use client";

import Image from "next/image";
import { useState } from "react";
import type { Category } from "@/data/categories";
import { PlayIcon } from "@/components/icons";

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

  if (!vimeoId || failed) {
    return (
      <span
        className={`absolute inset-0 flex items-center justify-center ${accent.bgClass} opacity-25`}
      >
        <PlayIcon className="size-6 text-navy-950" />
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
