"use client";

import { useEffect, useState } from "react";

// The quote beside the Join button, turning over between a few results.
// Each is an excerpt, word for word, from src/data/testimonials.ts -
// whole sentences only, nothing reworded. All of them sit in the same
// grid cell, so the card keeps the height of the longest and nothing
// below it jumps as they change. Waits while the mouse is over it.
// White with dark ink: the one light card on the page, so the proof is
// the first thing the eye lands on beside the Join button.

const QUOTES = [
  {
    quote:
      "In only week 2 I already learned how to stop the ‘um’, and the value that Tariq has been dropping is paradigm-shifting.",
    name: "Sharon Ho",
  },
  {
    quote:
      "In the first week I felt a shift. Talking into the camera, Tariq has a gift that is helping me build my confidence, which I haven't experienced before.",
    name: "Jackie Briggs",
  },
  {
    quote:
      "I learned so much, definitely improved my speaking ability on camera, and it gave me a huge boost in my confidence.",
    name: "Natasha Hein",
  },
];

const STEP = 6500; // ms each quote stays

export function QuoteCycle() {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held) return;
    const t = setTimeout(() => setAt((i) => (i + 1) % QUOTES.length), STEP);
    return () => clearTimeout(t);
  }, [at, held]);

  return (
    <figure
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      className="w-full max-w-md rounded-2xl bg-white px-6 py-5 shadow-[0_24px_60px_-28px_rgb(255_255_255_/_0.45)]"
    >
      <div className="grid">
        {QUOTES.map((q, i) => (
          <div
            key={q.name}
            aria-hidden={i !== at}
            className={`col-start-1 row-start-1 flex flex-col justify-center transition-opacity duration-700 ${
              i === at ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <blockquote className="text-base font-semibold leading-snug text-navy-950 text-balance">
              &ldquo;{q.quote}&rdquo;
            </blockquote>
            <p className="mt-2 text-xs font-semibold text-[#5b6280]">
              {q.name}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {QUOTES.map((q, i) => (
          <button
            key={q.name}
            type="button"
            aria-label={`Quote from ${q.name}`}
            aria-current={i === at}
            onClick={() => setAt(i)}
            className="p-1"
          >
            <span
              className={`block size-1.5 rounded-full transition-colors ${i === at ? "bg-navy-950" : "bg-navy-950/20"}`}
            />
          </button>
        ))}
      </div>
    </figure>
  );
}
