"use client";

import Image from "next/image";
import { useState } from "react";
import { VimeoPlayer } from "@/components/vimeo-player";
import { PlayFillIcon } from "@/components/player-icons";

// A facade for the Vimeo player. The real embed pulls ~1.4 MB of player
// script the moment it mounts — far too much to spend on a visitor who
// may never press play. Until they do, this is just a poster and a
// button; the click swaps in the real player and starts it.

export function LazyVimeoPlayer({
  vimeoId,
  title,
  poster,
}: {
  vimeoId: string;
  title: string;
  poster: string;
}) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return <VimeoPlayer vimeoId={vimeoId} title={title} autoplay />;
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      aria-label={`Play: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-navy-950"
    >
      <Image
        src={poster}
        alt=""
        fill
        sizes="(min-width: 640px) 672px, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        priority
      />
      <span className="absolute inset-0 bg-navy-950/25 transition-colors group-hover:bg-navy-950/10" />
      <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-navy-950/70 backdrop-blur-sm transition-transform group-hover:scale-110">
        <PlayFillIcon className="size-7 translate-x-0.5 text-ink" />
      </span>
    </button>
  );
}
