"use client";

import Image from "next/image";
import { useState } from "react";
import { cueIcons } from "@/components/cue-icons";
import type { Category } from "@/data/categories";

// A lesson as a card you can hold.
//
// Every lesson in the library is one to two minutes of video. A card is
// the same lesson at a glance: the thing it teaches, the two or three
// points to walk away holding, and the color of the section it belongs
// to. It stands in for the video when there's no time to watch one -
// and it's the form the course takes when it leaves the screen.
//
// PRINTED DECK
// ------------
// This is drawn to poker-card proportions (63 x 88 mm, the ratio a deck
// box and a card sleeve are already built for) so the same component
// can be laid out for print without redrawing. Three things follow from
// that and are honored here:
//
//   - Nothing meaningful sits within about 4mm of an edge, because a
//     guillotine wanders and a printed card gets trimmed through its
//     bleed. The faces keep their own quiet margin.
//   - The two faces are independent artwork. A physical card doesn't
//     fade between sides; it's one image front, one image back.
//   - The corner index repeats the category so a card is identifiable
//     fanned out in a hand, the way a playing card's rank is.
//
// Every measurement on the card - type, padding, the mark's well - is
// expressed in cqw, a share of the card's own width. One artwork then
// holds at any size: the 320px preview on this page and the 63mm card
// coming off a guillotine are the same drawing, not two that have to be
// kept in agreement. Fixed pixel type looked right on screen and
// overflowed the cut card, which is how this was found.
//
// The one thing print will argue with is the palette: these are neon
// screen colors and several sit outside CMYK's gamut, so a press will
// render them duller than they look here. That's a decision for whoever
// specs the print run - spot inks hold them, four-color won't.

export interface LessonCardData {
  category: Category;
  /** Section title as printed on the card - "Storytelling techniques". */
  section: string;
  title: string;
  points: string[];
  /** A cue-icon name, the lesson's own motif. Optional. */
  icon?: string;
  /** Position in its section, printed as the card's index: 3 of 15. */
  index?: number;
  total?: number;
}

export function LessonCard({
  data,
  className = "",
}: {
  data: LessonCardData;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const { category } = data;
  const Icon = data.icon ? cueIcons[data.icon] : undefined;
  const color = `var(--color-${category.id})`;

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={`${data.title} - ${flipped ? "showing the key points, tap to turn over" : "tap to turn over"}`}
      className={`card-3d group aspect-[63/88] w-full max-w-xs cursor-pointer ${className}`}
    >
      <span className={`card-3d-inner ${flipped ? "is-flipped" : ""}`}>
        {/* ── Face: the section's color, and the mark ───────────────── */}
        <span
          aria-hidden={flipped}
          className="card-face flex flex-col items-center justify-between overflow-hidden p-[6.2cqw]"
          style={{ background: color }}
        >
          {/* Corner index - what identifies the card in a fanned hand */}
          <span className="flex w-full items-start justify-between text-navy-950">
            <span className="text-[3cqw] font-bold uppercase tracking-[0.18em]">
              {category.name.split(" ")[0]}
            </span>
            {data.index && data.total && (
              <span className="text-[3cqw] font-bold tabular-nums opacity-70">
                {String(data.index).padStart(2, "0")}/{data.total}
              </span>
            )}
          </span>

          {/* The mark, in its own navy well */}
          <span className="relative flex size-[35cqw] items-center justify-center rounded-full bg-navy-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
            <Image
              src="/logo-mark.png"
              alt=""
              width={320}
              height={266}
              className="w-[20cqw]"
            />
          </span>

          <span className="flex w-full flex-col items-center gap-[1.2cqw] text-navy-950">
            <span className="text-center text-[4.4cqw] font-bold leading-tight text-balance">
              {data.section}
            </span>
            <span className="text-[2.7cqw] font-semibold uppercase tracking-[0.22em] opacity-70">
              Speak Better
            </span>
          </span>
        </span>

        {/* ── Face: the lesson itself ───────────────────────────────── */}
        <span
          aria-hidden={!flipped}
          className="card-face card-face-back flex flex-col gap-[2.5cqw] overflow-hidden bg-gradient-to-b from-navy-800 via-navy-900 to-navy-950 p-[6.2cqw]"
        >
          {/* A breath of the section's color in the corner, so the two
              faces read as the same card seen from either side. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(120% 80% at 12% 0%, color-mix(in oklab, ${color} 16%, transparent), transparent 62%)`,
            }}
          />

          {/* The lesson's own motif, large and faint - the same glyph the
              player floats during the video, so the card and the lesson
              look like the same thing. Low and to the right, where it
              fills the space the words leave rather than sitting under
              them. */}
          {Icon && (
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.09]"
              style={{ color }}
            >
              {Icon({ className: "size-[55cqw]" })}
            </span>
          )}

          <span className="relative flex items-center gap-[2.5cqw]">
            <Image
              src="/logo-mark.png"
              alt=""
              width={320}
              height={266}
              className="w-[8.5cqw] shrink-0"
            />
            <span
              className="text-[2.9cqw] font-bold uppercase tracking-[0.2em]"
              style={{ color }}
            >
              {data.section}
            </span>
          </span>

          <span
            className="relative h-px w-full"
            style={{ background: color, opacity: 0.35 }}
          />

          {/* The lesson fills the middle of the card rather than stacking
              at the top - two bullets and three should both look like a
              card someone designed, not a page that ran short. */}
          <span className="relative flex flex-1 flex-col justify-center gap-[3.2cqw] py-[1cqw]">
            <span className="text-left text-[5cqw] font-semibold leading-snug text-ink text-balance">
              {data.title}
            </span>

            <ul className="flex flex-col gap-[2.8cqw] text-left">
              {data.points.map((point) => (
                <li key={point} className="flex gap-[2.5cqw]">
                  <span
                    aria-hidden
                    className="mt-[1.6cqw] size-[1.5cqw] shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-[3.5cqw] leading-snug text-ink-muted">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </span>

          <span className="relative flex items-center justify-between pt-[2.5cqw]">
            <span className="text-[2.5cqw] font-semibold uppercase tracking-[0.22em] text-ink-faint">
              Speak Better
            </span>
            {data.index && data.total && (
              <span className="text-[2.5cqw] font-bold tabular-nums text-ink-faint">
                {String(data.index).padStart(2, "0")}/{data.total}
              </span>
            )}
          </span>
        </span>
      </span>
    </button>
  );
}
