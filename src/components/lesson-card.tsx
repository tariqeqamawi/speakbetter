"use client";

import Image from "next/image";
import { useState } from "react";
import { cueIcons } from "@/components/cue-icons";
import { CategoryIcon } from "@/components/category-icons";
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
// This is drawn to oracle-deck proportions - 89 x 127 mm, 3.5 x 5 in -
// not the poker size a playing deck uses. An oracle card is a card you
// read rather than a card you play: it's held one at a time, it carries
// text, and it's meant to sit face up on a table. That's the right
// object for a lesson, and it's what every print house means by "oracle"
// or "large tarot" stock. Being 41% wider than a poker card also lifts
// the printed body text from about 6pt to about 9pt, which is the
// difference between a card you squint at and one you read.
//
// Three things follow from designing for the press and are honored here:
//
//   - Nothing meaningful sits within about 4mm of an edge, because a
//     guillotine wanders and a printed card gets trimmed through its
//     bleed. The faces keep their own quiet margin.
//   - The two faces are independent artwork. A physical card doesn't
//     fade between sides; it's one image front, one image back.
//   - The corner code repeats the section so a card is placeable in a
//     fanned hand, the way a playing card's rank is - but it stops at
//     the section. Which lesson a card is stays on the face that shows
//     the lesson.
//
// Every measurement on the card - type, padding, the mark's well - is
// expressed in cqw, a share of the card's own width. One artwork then
// holds at any size: the preview on this page and the 89mm card coming
// off a guillotine are the same drawing, not two that have to be kept in
// agreement. Fixed pixel type looked right on screen and overflowed the
// cut card, which is how this was found - and it's why resizing the
// whole deck from poker to oracle stock was a one-line change.
//
// The palette is settled: spot inks and neon stock for any real run, so
// these colors print as they look here rather than as the dull CMYK
// approximation four-color would give. That's the more expensive answer
// and the right one - the seven colors are how the whole course is
// organised, and a deck that gets them wrong is a deck that lies about
// which section a card came from.

export interface LessonCardData {
  category: Category;
  /** Section title as printed on the card - "Storytelling techniques". */
  section: string;
  title: string;
  /** The fallback: this lesson's key takeaways. */
  points: string[];
  /** What it is, how to use it, and his own lines - see card-content.ts */
  what?: string;
  how?: string;
  like?: string[];
  /** A cue-icon name, the lesson's own motif. Optional. */
  icon?: string;
  /** Position in its section, printed as the card's index: 3 of 15. */
  index?: number;
  total?: number;
  /** Overrides for the one card that isn't a lesson - see rulesCard. */
  code?: string;
  color?: string;
  background?: string;
}

/**
 * The neon plate at the top of a card.
 *
 * The dashboard's section banners are photographs of neon tube against a
 * dark wall, haze around them and a wet floor underneath. This is the
 * same idea drawn rather than photographed: the lesson's own motif as a
 * lit tube in the section's color, its glow bleeding into the dark, and
 * a soft reflection beneath it.
 *
 * Drawn rather than generated for two reasons. It's vector, so it stays
 * sharp on a printed card where a photographic render would need to be
 * supplied at 300dpi for all 81 - and it's one ink, which is what the
 * deck is going to be printed in (see the palette note above). A neon
 * photograph is thousands of colors and cannot be run as a spot color.
 */
function NeonPlate({
  Icon,
  color,
}: {
  Icon: (props: { className?: string }) => React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="relative flex h-[26cqw] w-full shrink-0 items-center justify-center overflow-hidden rounded-[2cqw] bg-navy-950"
      aria-hidden
    >
      {/* The haze the tube throws into the room behind it */}
      <span
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 70% at 50% 42%, color-mix(in oklab, ${color} 34%, transparent), transparent 70%)`,
        }}
      />
      {/* The floor it stands on, and the line where they meet */}
      <span
        className="absolute inset-x-0 bottom-0 h-[38%]"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklab, ${color} 12%, transparent), transparent)`,
        }}
      />
      {/* The tube itself, and its reflection in the wet floor */}
      <span
        className="relative flex flex-col items-center"
        style={{
          color,
          filter: `drop-shadow(0 0 0.8cqw ${color}) drop-shadow(0 0 2.4cqw ${color}) drop-shadow(0 0 5cqw ${color})`,
        }}
      >
        {Icon({ className: "size-[14cqw]" })}
        <span className="-mt-[1cqw] scale-y-[-0.55] opacity-30 blur-[0.4cqw]">
          {Icon({ className: "size-[14cqw]" })}
        </span>
      </span>
    </span>
  );
}

/** A labelled line on the lesson face: WHAT, HOW. */
function Block({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex flex-col gap-[0.6cqw]">
      <span
        className="text-[2.4cqw] font-bold uppercase tracking-[0.18em]"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-[3.05cqw] leading-[1.35] text-ink-muted">
        {children}
      </span>
    </span>
  );
}

/**
 * How the colored face is filled.
 *
 * This is a print decision as much as a screen one. The deck is going to
 * a press in spot inks on neon stock, and a spot ink prints either solid
 * or as a screened tint - a gradient is a graduated halftone. Fluorescent
 * pigments are the worst inks to screen: they're less opaque than process
 * inks, so a 70% tint doesn't read as "slightly deeper neon", it reads as
 * the stock showing through, and long soft ramps band. Flat is what you
 * pay for spot neon to get.
 *
 * So the two that hold up in one solid ink are "flat" and "engraved" -
 * engraved being a line pattern at full strength rather than a tone.
 * "vignette" and "linear" are the honest screen answers, kept here to be
 * judged side by side at /prototype/cards.
 */
export type FaceTreatment = "flat" | "vignette" | "linear" | "engraved";

/** The fill laid over the face's flat color. Nothing, for "flat". */
function FaceWash({ treatment }: { treatment: FaceTreatment }) {
  if (treatment === "flat") return null;

  const navy = "var(--color-navy-950)";
  const background =
    treatment === "vignette"
      ? `radial-gradient(78% 62% at 50% 38%, color-mix(in oklab, white 16%, transparent), transparent 55%), radial-gradient(100% 85% at 50% 55%, transparent 40%, color-mix(in oklab, ${navy} 26%, transparent))`
      : treatment === "linear"
        ? `linear-gradient(to bottom, color-mix(in oklab, white 14%, transparent), transparent 38%, color-mix(in oklab, ${navy} 24%, transparent))`
        : // Concentric rings around the well, at full ink rather than a
          // tone - the one texture that survives a single spot color.
          `repeating-radial-gradient(circle at 50% 50%, transparent 0 5.6cqw, color-mix(in oklab, ${navy} 16%, transparent) 5.6cqw 5.8cqw)`;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background }}
    />
  );
}

export function LessonCard({
  data,
  startFlipped = false,
  face = "flat",
  className = "",
}: {
  data: LessonCardData;
  /**
   * Open lesson-side up. The deck deals cards face down, because that's
   * what a deck does - but a card called up beside its own lesson is
   * being read, not pulled, and should already be the right way round.
   */
  startFlipped?: boolean;
  /** How the colored face is filled - see FaceTreatment. */
  face?: FaceTreatment;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(startFlipped);
  const { category } = data;
  // The lesson's own motif where it has one, the section's icon where it
  // doesn't - every card gets a lit plate, none goes dark.
  const motif = data.icon ? cueIcons[data.icon] : undefined;
  const Icon =
    motif ??
    ((props: { className?: string }) => (
      <CategoryIcon category={category.id} className={props.className} />
    ));
  const color = data.color ?? `var(--color-${category.id})`;
  const code = data.code ?? category.code;
  const showBack = flipped;

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={showBack}
      aria-label={`${data.title} - ${flipped ? "showing the lesson, tap to turn over" : "tap to turn over"}`}
      className={`card-3d group aspect-[89/127] w-full max-w-xs cursor-pointer ${className}`}
    >
      <span className={`card-3d-inner ${showBack ? "is-flipped" : ""}`}>
        {/* ── Face: the section's color, and the mark ───────────────── */}
        <span
          aria-hidden={showBack}
          className="card-face flex flex-col items-center justify-between overflow-hidden p-[6.2cqw]"
          style={{ background: data.background ?? color }}
        >
          <FaceWash treatment={face} />

          {/* Face down, a card gives away its section and nothing else.
              Both corners carry the same short code rather than one of
              them carrying a card number, because a number would make
              each card identifiable while it's still turned over - and a
              deck whose backs can be told apart isn't a deck. The color
              does the work; the code names the color. */}
          <span className="relative flex w-full items-start justify-between text-navy-950">
            <span className="text-[3cqw] font-bold uppercase tracking-[0.22em]">
              {code}
            </span>
            <span className="text-[3cqw] font-bold uppercase tracking-[0.22em] opacity-45">
              {code}
            </span>
          </span>

          {/* The mark, in its own navy well */}
          <span className="relative flex size-[35cqw] items-center justify-center rounded-full bg-navy-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
            <Image
              src="/logo-mark.png"
              alt=""
              width={320}
              height={266}
              className="w-[27cqw]"
            />
          </span>

          <span className="relative flex w-full flex-col items-center gap-[1.2cqw] text-navy-950">
            <span className="text-center text-[4.4cqw] font-bold leading-tight text-balance">
              {data.section}
            </span>
            <span className="text-[2.7cqw] font-semibold uppercase tracking-[0.22em] opacity-70">
              Speak Better
            </span>
          </span>
        </span>

        {/* ── Face: the lesson itself ───────────────────────────── */}
        <span
          aria-hidden={!flipped}
          className="card-face card-face-back flex flex-col gap-[2.2cqw] overflow-hidden bg-gradient-to-b from-navy-800 via-navy-900 to-navy-950 p-[5.6cqw] text-left"
        >
          {/* A breath of the section's color in the corner, so the two
              faces read as the same card seen from either side. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(120% 80% at 12% 0%, color-mix(in oklab, ${color} 14%, transparent), transparent 62%)`,
            }}
          />

          {/* The lit plate across the top - the lesson's motif in neon */}
          <NeonPlate Icon={Icon} color={color} />

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

          <span className="relative text-[4.3cqw] font-semibold leading-snug text-ink text-balance">
            {data.title}
          </span>

          {/* What it is, how to use it, and what it sounds like out of
              his mouth. A card is held by someone who may not have seen
              the lesson this week, so it has to teach rather than just
              remind - see card-content.ts. Lessons not yet written up
              fall back to their key takeaways. */}
          <span className="relative flex flex-1 flex-col gap-[2.2cqw] py-[0.4cqw]">
            {data.what && data.how ? (
              <>
                <Block label="What" color={color}>
                  {data.what}
                </Block>
                <Block label="How" color={color}>
                  {data.how}
                </Block>
                {data.like && data.like.length > 0 && (
                  <span className="flex flex-col gap-[1.2cqw]">
                    <span
                      className="text-[2.4cqw] font-bold uppercase tracking-[0.18em]"
                      style={{ color }}
                    >
                      Like this
                    </span>
                    {data.like.slice(0, 3).map((line) => (
                      <span
                        key={line}
                        className="border-l-[0.6cqw] pl-[2cqw] text-[2.95cqw] italic leading-[1.32] text-ink"
                        style={{ borderColor: `color-mix(in oklab, ${color} 55%, transparent)` }}
                      >
                        {line}
                      </span>
                    ))}
                  </span>
                )}
              </>
            ) : (
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
            )}
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
