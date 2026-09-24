"use client";

import { Avatar } from "@/components/avatar";
import type { Testimonial } from "@/data/testimonials";

// Students' own words, drifting up the page.
//
// WHY IT MOVES. A wall of twenty-six quotes is read as "there are a
// lot of quotes" and not one of them is actually read. A slow drift
// makes each one arrive on its own, so the eye lands on a single
// sentence, finishes it, and the next one comes - which is how
// somebody actually takes in social proof. It also means the section
// is never a wall: whatever its height, it is always showing a few.
//
// WHY THE FACES ARE NOT PHOTOGRAPHS. These are real people's words.
// An invented portrait beside a real name is not decoration, it is a
// picture of somebody who does not exist being presented as them -
// on the page where a stranger decides whether to trust this. So each
// quote carries the app's own mark: their initial on one of the seven
// colours, settled by the name so the same person is the same colour
// everywhere. Obviously a token, never mistakable for a face. Real
// photographs, with permission, would be strictly better and drop
// straight into the same slot.
//
// The drift is one transform per column, so the compositor owns it and
// the main thread does nothing - the rule everywhere in this app after
// what one custom-property keyframe once cost it.

export function TestimonialStream({
  items,
  /** Columns on a wide screen. One on a phone, always. */
  columns = 3,
  /** Seconds for a column to travel its own length. Slow. */
  pace = 90,
}: {
  items: Testimonial[];
  columns?: number;
  pace?: number;
}) {
  if (items.length === 0) return null;

  // Dealt round-robin so neighbouring columns never show consecutive
  // quotes, which is what makes three columns look like three lists.
  const lanes: Testimonial[][] = Array.from({ length: columns }, () => []);
  items.forEach((t, i) => lanes[i % columns].push(t));

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "min(30rem, 78vh)" }}
    >
      <div className="flex justify-center gap-3 sm:gap-4">
        {lanes.map((lane, i) => (
          <div
            key={i}
            className={`w-full max-w-sm shrink-0 ${i === 0 ? "" : "hidden"} ${
              i < 2 ? "sm:block" : ""
            } ${i < columns ? "lg:block" : ""}`}
          >
            <div
              className="testimonial-lane flex flex-col gap-3 sm:gap-4"
              // Each lane runs at its own speed, so they never march in
              // step - which is the thing that makes a marquee look
              // like a marquee.
              style={{ animationDuration: `${pace + i * 16}s` }}
            >
              {/* Twice, so the loop has somewhere to come round from. */}
              {[...lane, ...lane].map((t, j) => (
                <Quote key={`${t.name}-${j}`} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Faded top and bottom, so the quotes arrive and leave rather
          than being cut off by an edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        style={{ background: "linear-gradient(180deg, var(--color-navy-950), transparent)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
        style={{ background: "linear-gradient(0deg, var(--color-navy-950), transparent)" }}
      />
    </div>
  );
}

function Quote({ t }: { t: Testimonial }) {
  return (
    <figure className="flex flex-col gap-2.5 rounded-2xl border border-navy-600 bg-navy-800 p-4">
      <blockquote className="text-sm leading-relaxed text-ink-muted">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-2.5">
        <Avatar name={t.name} className="size-8" />
        <span className="text-xs font-semibold text-ink">{t.name}</span>
      </figcaption>
    </figure>
  );
}
