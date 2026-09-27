"use client";

import { useState } from "react";
import { categories } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";

// "Take a look inside": the book open on the page, a spread at a time,
// with "Turn page" to leaf through it - the way the best book sites let
// a visitor hold the thing before it exists. The book isn't written
// yet, so what's inside is its shape, from the course it grows out of:
// the contents, then one spread per colour - what the colour is, on the
// left; the skills it covers, from the lessons themselves, on the right.
// No invented prose: when chapters are drafted, their opening pages
// replace these.

type Spread = { left: React.ReactNode; right: React.ReactNode };

const ORDER = ["mindset", "storytelling", "figurative", "acting", "structure", "body-language", "advanced"] as const;

function spreads(): Spread[] {
  const chapters = ORDER.map((id) => categories.find((c) => c.id === id)!);
  const contents: Spread = {
    left: (
      <div className="flex h-full flex-col justify-center gap-3 text-center">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-[#6b6f7c]">Speak Better</p>
        <p className="font-serif text-2xl leading-tight text-[#141824] sm:text-3xl">The 7 Colors of Fearless, Unforgettable Speaking</p>
        <p className="font-serif text-sm italic text-[#4a4f5c]">Find your true colors. Unleash your confidence. Roar on screen and stage.</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-[#141824]">TARIQ EQ AMAWI</p>
      </div>
    ),
    right: (
      <div className="flex h-full flex-col gap-3">
        <p className="font-serif text-xl text-[#141824]">Contents</p>
        <ol className="flex flex-col gap-2">
          {chapters.map((c, i) => (
            <li key={c.id} className="flex items-baseline gap-3 font-serif text-[0.95rem] text-[#232838]">
              <span className="w-5 text-right text-[#8a8f9c]">{i + 1}</span>
              <span className={`size-2.5 shrink-0 translate-y-[-1px] rounded-full ${c.bgClass}`} />
              <span>
                {c.name} <span className="text-[#8a8f9c]">- {c.colorName.toLowerCase()}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    ),
  };
  const perColour: Spread[] = chapters.map((c, i) => ({
    left: (
      <div className="flex h-full flex-col gap-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-[#8a8f9c]">Chapter {i + 1}</p>
        <span className={`block h-1.5 w-16 rounded-full ${c.bgClass}`} />
        <p className="font-serif text-3xl leading-tight text-[#141824]">{c.name}</p>
        <p className="font-serif text-sm italic text-[#6b6f7c]">The {c.colorName.toLowerCase()} color</p>
        <p className="font-serif text-[1.02rem] leading-relaxed text-[#232838]">{c.blurb}</p>
      </div>
    ),
    right: (
      <div className="flex h-full flex-col gap-3">
        <p className="font-serif text-lg text-[#141824]">In this chapter</p>
        <ul className="flex flex-col gap-1.5">
          {lessonsInCategory(c.id)
            .slice(0, 8)
            .map((l) => (
              <li key={l.vimeoId} className="flex gap-2 font-serif text-[0.92rem] leading-snug text-[#232838]">
                <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${c.bgClass}`} />
                {l.title}
              </li>
            ))}
        </ul>
      </div>
    ),
  }));
  return [contents, ...perColour];
}

export function LookInside() {
  const all = spreads();
  const [at, setAt] = useState(0);
  const [turning, setTurning] = useState<1 | -1 | 0>(0);
  const go = (dir: 1 | -1) => {
    const next = at + dir;
    if (next < 0 || next >= all.length || turning) return;
    setTurning(dir);
    window.setTimeout(() => {
      setAt(next);
      setTurning(0);
    }, 260);
  };
  const s = all[at];
  // On a phone the two pages stack, left above right.
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-4xl [perspective:1800px]">
        {/* The block of pages under the spread, for thickness. */}
        <div aria-hidden className="absolute inset-x-1 -bottom-2 top-2 rounded-md bg-[#d9dbe0] shadow-2xl shadow-black/60" />
        <div
          className="relative grid min-h-[26rem] overflow-hidden rounded-md bg-[#f6f5f1] transition-[transform,opacity] duration-[260ms] ease-in sm:grid-cols-2"
          style={{
            transform: turning ? `rotateY(${turning * -8}deg) translateX(${turning * -12}px)` : undefined,
            opacity: turning ? 0.35 : 1,
          }}
          aria-live="polite"
        >
          {/* The gutter shadow between the two pages. */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent sm:block" />
          <div className="p-7 sm:p-10">{s.left}</div>
          <div className="border-t border-black/5 p-7 sm:border-t-0 sm:p-10">{s.right}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={at === 0}
          className="rounded-full border border-navy-600 px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
        >
          ‹ Back
        </button>
        <span className="text-xs tabular-nums text-ink-faint">
          {at + 1} / {all.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={at === all.length - 1}
          className="rounded-full border border-navy-600 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink-faint disabled:opacity-30"
        >
          Turn page ›
        </button>
      </div>
    </div>
  );
}
