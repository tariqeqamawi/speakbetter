"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Three beats, one thought: you don't learn to sing at concerts, you
// didn't learn to drive by buying a course - so you won't learn to speak
// by watching videos. On a laptop all three stand side by side across
// the full width, read left to right, the last one landing on "You have
// to actually practice." On a phone there's room for one at a time, so
// they take turns as a carousel, with dots to jump between them.

const BEATS = [
  {
    image: "/hero/concert-v2.jpg",
    alt: "At a concert, a woman standing at her seat belting along with the singer on stage, the people around her looking up, amused",
    line: "You don't learn to sing by going to concerts.",
  },
  {
    image: "/hero/driving-course-v3.jpg",
    alt: "A woman on her sofa gripping a steering wheel in front of her laptop, which shows the view from a driver's seat - her real car keys unused on the table",
    line: "You didn't learn to drive by buying a course.",
  },
  {
    image: "/hero/lecture-v2.jpg",
    alt: "Lying on the sofa under a blanket with a bowl of popcorn, watching a speaker hold a huge crowd on the big TV",
    line: "You won't learn to speak just by watching videos.",
    punch: "You have to actually practice.",
  },
];

const EVERY_MS = 4500;

export function HeroBeat() {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    // Turns only where it's a carousel, and never for anyone who asked
    // for less motion.
    const phone = window.matchMedia("(max-width: 1023px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (held || still.matches) return;
    const id = window.setInterval(() => {
      if (phone.matches) setAt((a) => (a + 1) % BEATS.length);
    }, EVERY_MS);
    return () => window.clearInterval(id);
  }, [held]);

  return (
    <section className="flex w-full flex-col items-center gap-3">
      <h2 className="sr-only">{BEATS.map((b) => [b.line, b.punch].filter(Boolean).join(" ")).join(" ")}</h2>
      <div className="grid w-full lg:grid-cols-3 lg:gap-4">
        {BEATS.map((b, i) => (
          <div
            key={b.image}
            aria-hidden={i !== at ? "true" : undefined}
            className={`relative col-start-1 row-start-1 overflow-hidden rounded-2xl border bg-navy-950 shadow-2xl shadow-navy-950/80 transition-opacity duration-700 lg:col-start-auto lg:row-start-auto lg:opacity-100 ${
              i === at ? "opacity-100" : "pointer-events-none opacity-0 lg:pointer-events-auto"
            } ${b.punch ? "border-figurative/60" : "border-navy-600"}`}
          >
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[5/4]">
              <Image
                src={b.image}
                alt={b.alt}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                priority={i === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/10 via-45% to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 [text-shadow:0_2px_14px_rgba(0,0,0,0.9)] sm:p-7">
              <span className="text-xs font-bold tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-2xl font-semibold leading-tight tracking-tight text-ink text-balance xl:text-3xl">{b.line}</p>
              {b.punch && (
                <p className="text-2xl font-bold leading-tight tracking-tight text-figurative text-balance xl:text-3xl">
                  {b.punch}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 lg:hidden" role="tablist" aria-label="Slides">
        {BEATS.map((b, i) => (
          <button
            key={b.image}
            type="button"
            role="tab"
            aria-selected={i === at}
            aria-label={`Slide ${i + 1}`}
            onClick={() => {
              setAt(i);
              setHeld(true);
            }}
            className={`h-2 rounded-full transition-all ${i === at ? "w-6 bg-figurative" : "w-2 bg-navy-600"}`}
          />
        ))}
      </div>
    </section>
  );
}
