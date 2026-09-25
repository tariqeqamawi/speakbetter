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

const COUNTS = [
  { n: 81, label: "nano lessons", color: "text-storytelling", image: "/what/lessons.webp" },
  { n: 24, label: "interactive challenges", color: "text-structure", image: "/what/challenges.webp" },
  { n: 79, label: "cards in the digital deck", color: "text-figurative", image: "/what/cards.webp" },
  { n: 1, label: "AI coach trained on the method", color: "text-advanced", image: "/what/coach.webp" },
  // The spectrum's picture and its number move through all seven colours.
  { n: 7, label: "colors of speaking to light up", color: "spectrum-cycle", image: "/what/spectrum.webp", cycle: true },
];

export function WhatItIs() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-navy-600 bg-navy-800 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-7">
        {/* The logo mark, not lion-head.png - that one is a frame from
            the roar animation, caught mid-open, and at ninety-six
            pixels the open mouth reads as a rendering fault rather
            than a roar. The mark is the lion at rest and is what the
            brand uses everywhere else on this page. */}
        <Image
          src="/logo-mark.png"
          alt=""
          width={220}
          height={220}
          className="size-24 shrink-0 object-contain sm:size-32"
        />
        <p className="text-lg text-ink-muted text-balance sm:text-xl">
          <strong className="font-semibold text-ink">Speak Better is built on practice:</strong> short lessons,
          real on-camera challenges, and true interactive feedback through an AI coach that watches your videos
          and gives you detailed, accurate feedback based on your physical and spoken performance.
        </p>
      </div>

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
