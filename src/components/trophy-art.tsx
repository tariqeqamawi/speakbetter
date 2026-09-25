"use client";

import { useState, type CSSProperties } from "react";
import { TrophyIcon } from "@/components/icons";

// One rendered trophy, won or not yet.
//
// NOT YET WON IS A SILHOUETTE. The old case showed a locked trophy as
// the render itself, greyed - which is the prize, just duller. What is
// worth showing somebody who has not won it is the SHAPE of what they
// are chasing: the figure blacked out, with a thin edge of light so it
// reads against a dark room, standing on its plinth. The plinth stays
// visible, a little dimmed, because the stand is what every trophy
// shares - it says "a trophy goes here" - and the figure on it is the
// part that has to be earned.
//
// The render is one image, so the two halves are the same file drawn
// twice and clipped: silhouette above the plinth line, plinth below.
// Every trophy is the same object - a figure on a short post on a
// square plinth - so the line is in nearly the same place on all of
// them; the finishing trophy stands on a taller stepped base.
//
// ART THAT IS NOT THERE YET. A trophy can be defined before its render
// lands (the founding cohort's was). A broken-image icon in a trophy
// case is the one thing worse than an empty slot, so a missing file
// becomes a plain plinth with the trophy mark on it.

/** Where the plinth starts, as a share of the render's height. */
const PLINTH_TOP = 0.76;
const PLINTH_TOP_GRAND = 0.7;

export function TrophyArt({
  src,
  won,
  grand = false,
  alt = "",
  className = "",
  style,
  lazy = false,
}: {
  src: string;
  won: boolean;
  grand?: boolean;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  lazy?: boolean;
}) {
  const [missing, setMissing] = useState(false);
  const cut = (grand ? PLINTH_TOP_GRAND : PLINTH_TOP) * 100;

  if (missing) return <TrophyPlaceholder won={won} className={className} style={style} label={alt} />;

  const img = (extra: CSSProperties, ariaHidden: boolean) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={ariaHidden ? "" : alt}
      aria-hidden={ariaHidden || undefined}
      draggable={false}
      loading={lazy ? "lazy" : undefined}
      onError={() => setMissing(true)}
      className="absolute inset-0 size-full select-none object-contain"
      style={extra}
    />
  );

  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      className={`relative block aspect-[3/4] ${className}`}
      style={style}
    >
      {won ? (
        img({}, true)
      ) : (
        <>
          {img(
            {
              clipPath: `inset(0 0 ${100 - cut}% 0)`,
              filter: "brightness(0) drop-shadow(0 0 1px rgba(166,173,196,0.55)) drop-shadow(0 0 6px rgba(166,173,196,0.12))",
              opacity: 0.9,
            },
            true,
          )}
          {img(
            {
              clipPath: `inset(${cut}% 0 0 0)`,
              filter: "grayscale(1) brightness(0.55)",
              opacity: 0.8,
            },
            true,
          )}
        </>
      )}
    </span>
  );
}

/** A plinth with the trophy mark on it, for a trophy whose render has
 *  not been added yet. */
export function TrophyPlaceholder({
  won,
  className = "",
  style,
  label = "",
}: {
  won: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      className={`relative flex aspect-[3/4] flex-col items-center justify-end ${className}`}
      style={style}
    >
      <TrophyIcon
        className={`mb-[4%] w-[42%] ${won ? "text-[#c98a4b] drop-shadow-[0_0_10px_rgba(201,138,75,0.5)]" : "text-navy-600"}`}
      />
      <span className="h-[3%] w-[34%] rounded-t-sm bg-gradient-to-b from-[#9aa3b8] to-[#4a5163]" />
      <span className="h-[18%] w-[62%] bg-gradient-to-b from-[#3a4052] to-[#1b1f2a]" />
      <span className="h-[1.2%] w-[62%] bg-[#c98a4b]/70" />
    </span>
  );
}
