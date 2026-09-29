import Image from "next/image";
import { CountUp } from "@/components/count-up";

// What Speak Better actually is, and what is in the box.
//
// WHAT CHANGED AND WHY. This spot used to repeat "master public
// speaking, overcome fear and shyness in minutes rather than months"
// for the third time on a single screen. By the third telling the
// reader has either believed it or stopped reading, and saying it
// again spends trust rather than building it. What they have NOT been
// told by this point is how any of it works - so that is what this
// says instead.
//
// The five numbers were a row of small grey pills, which is how a spec
// sheet looks. They are the most concrete thing on the page - the
// answer to "yes, but what do I actually get" - so they are drawn at
// the size of a claim, in the colours they belong to.

export const COUNTS = [
  { n: 83, label: "skill lessons", color: "text-storytelling", image: "/what/lessons.webp" },
  { n: 25, label: "interactive challenges", color: "text-structure", image: "/what/challenges.webp" },
  { n: 77, label: "cards in the digital deck", color: "text-figurative", image: "/what/cards.webp" },
  { n: 1, label: "AI coach trained on the method", color: "text-advanced", image: "/what/coach.webp" },
  // The spectrum's picture and its number move through all seven colours.
  { n: 7, label: "colors of speaking to light up", color: "spectrum-cycle", image: "/what/spectrum.webp", cycle: true },
];

export function WhatItIs() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:p-8">
      {/* The "built on practice" paragraph that opened this box was
          the fourth telling of practise-don't-watch before the reader
          reached the comparison that makes the case properly - so the
          box is only what's in it now. */}
      <h3 className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-ink-faint">What you get</h3>

      {/* Each number with a picture of what it is, counting up from 1
          the first time it is seen. */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {COUNTS.map((c) => (
          <li key={c.label} className="flex flex-col items-center gap-2 text-center">
            <span className="relative aspect-square w-full max-w-36 overflow-hidden rounded-2xl border border-navy-600 bg-navy-950">
              <Image
                src={c.image}
                alt=""
                fill
                sizes="144px"
                className={`object-cover ${c.cycle ? "spectrum-hue" : ""}`}
              />
            </span>
            <CountUp to={c.n} className={`text-4xl font-black leading-none ${c.color}`} />
            <span className="text-xs font-medium leading-tight text-ink-muted text-balance">{c.label}</span>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs font-medium text-ink-faint">
        …and the trophies, ranks, streaks and board to go with them.
      </p>
    </div>
  );
}
