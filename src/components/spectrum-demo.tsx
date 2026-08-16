"use client";

import { useEffect, useRef, useState } from "react";
import { categories, type CategoryId } from "@/data/categories";

// The color-spectrum score is the product's one genuinely novel idea,
// and until now the landing page only described it. This plays it: a
// flat talk lighting up two colors, then a dynamic one lighting up
// seven - the difference the course exists to create, shown rather than
// claimed.

interface Sample {
  label: string;
  caption: string;
  score: number;
  spectrum: Record<CategoryId, number>;
}

const FLAT: Sample = {
  label: "Before",
  caption: "Informative, accurate - and forgettable. Two colors.",
  score: 41,
  spectrum: {
    storytelling: 22,
    figurative: 12,
    acting: 15,
    structure: 68,
    mindset: 61,
    "body-language": 18,
    advanced: 9,
  },
};

const DYNAMIC: Sample = {
  label: "After",
  caption: "Same speaker, same topic - now reaching across all seven.",
  score: 88,
  spectrum: {
    storytelling: 91,
    figurative: 74,
    acting: 68,
    structure: 82,
    mindset: 86,
    "body-language": 77,
    advanced: 58,
  },
};

export function SpectrumDemo() {
  const [showing, setShowing] = useState<Sample>(FLAT);
  const [live, setLive] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  // Only animate once it's actually on screen, and alternate from there.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setLive(true),
      { threshold: 0.4 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live) return;
    // Without motion, settle straight on the "after" - the point of the
    // demo is the widened spectrum, not the cycling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const once = setTimeout(() => setShowing(DYNAMIC), 0);
      return () => clearTimeout(once);
    }
    const id = setInterval(
      () => setShowing((s) => (s === FLAT ? DYNAMIC : FLAT)),
      3400,
    );
    return () => clearInterval(id);
  }, [live]);

  const lit = categories.filter((c) => showing.spectrum[c.id] >= 40).length;

  return (
    <div
      ref={hostRef}
      className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-500 ${
              showing === FLAT ? "text-ink-faint" : "text-mindset"
            }`}
          >
            {showing.label}
          </span>
          <span className="text-xs text-ink-faint">
            {lit} of 7 colors
          </span>
        </span>
        <span className="text-2xl font-bold tabular-nums text-ink transition-all duration-500">
          {showing.score}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const value = showing.spectrum[cat.id];
          const on = value >= 40;
          return (
            <div key={cat.id} className="flex items-center gap-3">
              <span
                className={`w-32 shrink-0 truncate text-[0.7rem] transition-colors duration-700 sm:w-44 ${
                  on ? "text-ink" : "text-ink-faint"
                }`}
              >
                {cat.name}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-navy-700">
                <span
                  className={`block h-full rounded-full ${cat.bgClass}`}
                  style={{
                    width: `${value}%`,
                    opacity: on ? 1 : 0.35,
                    transition:
                      "width 900ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease",
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>

      <p className="min-h-8 text-sm text-ink-muted transition-opacity duration-500">
        {showing.caption}
      </p>

      <div className="flex gap-2">
        {[FLAT, DYNAMIC].map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setLive(false);
              setShowing(s);
            }}
            aria-pressed={showing === s}
            className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              showing === s
                ? "bg-navy-600 text-ink"
                : "border border-navy-600 text-ink-faint hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
