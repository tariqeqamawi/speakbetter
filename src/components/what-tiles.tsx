"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { lessons } from "@/data/lessons";
import { categories, type CategoryId } from "@/data/categories";
import { CategoryIcon } from "@/components/category-icons";
import { LionMouth } from "@/components/lion-mouth";
import { SpectrumWave } from "@/components/spectrum-wave";

// The five "What's in the app" numbers, each shown as the thing itself
// moving rather than a still picture: the lessons as a shuffling collage
// of their own thumbnails, the challenges as the road scrolling, the
// deck being fanned through its colors, Coach talking, and the spectrum
// turning from wave to bars and back. Each is a square tile; each rests
// when the visitor has asked for less motion.

function useTick(ms: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setN((x) => x + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return n;
}

const COLOR = (id: CategoryId) => `var(--color-${id})`;

// ── 83 skill lessons: a collage of their thumbnails, shuffling ─────────
// Seven slots of different sizes, overlapping; every beat one slot takes
// the next lesson, so the whole library passes through.
const SLOTS = [
  { x: 2, y: 4, w: 58, r: -6 },
  { x: 44, y: 0, w: 50, r: 5 },
  { x: 30, y: 30, w: 44, r: -2 },
  { x: 0, y: 52, w: 46, r: 4 },
  { x: 50, y: 48, w: 48, r: -5 },
  { x: 22, y: 66, w: 40, r: 7 },
  { x: 62, y: 26, w: 34, r: 3 },
];

export function LessonsCollage() {
  const n = useTick(900);
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-950">
      {SLOTS.map((s, i) => {
        // Each slot moves on when it's its turn; the rest hold.
        const turn = Math.floor((n + (SLOTS.length - i)) / SLOTS.length);
        const lesson = lessons[(i * 11 + turn * 7) % lessons.length];
        return (
          <div
            key={i}
            className="absolute overflow-hidden rounded-md border-2 shadow-lg shadow-black/60 transition-transform duration-700"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.w}%`,
              aspectRatio: "16 / 9",
              borderColor: COLOR(lesson.category),
              transform: `rotate(${s.r}deg) scale(${n % SLOTS.length === i ? 1.08 : 1})`,
              zIndex: n % SLOTS.length === i ? 10 : i,
            }}
          >
            <Image
              key={lesson.vimeoId}
              src={`/thumbs/${lesson.vimeoId}.jpg`}
              alt=""
              fill
              sizes="120px"
              className="tile-fade-in object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}

// ── 25 challenges: the 2D road, scrolling top to bottom ────────────────
export function ChallengesRoad() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-950">
      <video
        src="/film/tour-road2d.mp4"
        poster="/film/tour-road2d.jpg"
        muted
        loop
        playsInline
        autoPlay
        aria-hidden
        className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 scale-[1.35] object-cover"
      />
    </div>
  );
}

// ── 77 cards: fanning through the deck, color by color ─────────────────
export function DeckFan() {
  const n = useTick(1100);
  // Left to right and back: 0..6..0.
  const cycle = categories.length * 2 - 2;
  const step = n % cycle;
  const at = step < categories.length ? step : cycle - step;
  const active = categories[at];
  return (
    <div
      className="absolute inset-0 overflow-hidden transition-colors duration-700"
      style={{ background: `radial-gradient(70% 60% at 50% 60%, color-mix(in oklab, ${COLOR(active.id)} 30%, #060a15), #060a15)` }}
    >
      {categories.map((c, i) => {
        const off = i - at;
        return (
          <div
            key={c.id}
            className="absolute left-1/2 top-[18%] flex h-[62%] w-[38%] flex-col items-center justify-between rounded-lg border border-white/20 p-2 shadow-xl shadow-black/60 transition-all duration-700 ease-out"
            style={{
              background: COLOR(c.id),
              transform: `translateX(calc(-50% + ${off * 22}%)) rotate(${off * 7}deg) translateY(${Math.abs(off) * 5 - (off === 0 ? 8 : 0)}%)`,
              zIndex: 20 - Math.abs(off),
              opacity: Math.abs(off) > 3 ? 0 : 1,
            }}
          >
            <CategoryIcon category={c.id} className="size-5 text-navy-950" />
            <span className="text-center text-[0.55rem] font-bold uppercase leading-tight tracking-wide text-navy-950">
              {c.short}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 1 AI coach: the lion, talking, captions underneath ─────────────────
const LINES = [
  "Your hands drew the loaf - the gesture did the describing with you.",
  "Drop to a whisper on the line that matters.",
  "Two colors lit today. Let's reach for a third.",
  "You didn't apologize once. That's confidence.",
];

export function CoachTalking() {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const f = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, []);
  const line = LINES[Math.floor(t / 3.2) % LINES.length];
  const within = t % 3.2;
  // Talking for most of each line, a breath between.
  const level = within < 2.6 ? Math.max(0, Math.sin(t * 13) * 0.5 + Math.sin(t * 7.3) * 0.35) : 0;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden bg-navy-950 px-2 pt-1">
      <LionMouth level={level} className="w-[62%]" />
      <p key={line} className="tile-fade-in rounded-md bg-black/50 px-2 py-1 text-center text-[0.6rem] font-medium leading-snug text-white">
        {line}
      </p>
    </div>
  );
}

// ── 7 colors: the spectrum as the app draws it, wave then bars ─────────
const SAMPLE: Record<CategoryId, number>[] = [
  { storytelling: 72, figurative: 34, acting: 41, structure: 58, mindset: 66, "body-language": 63, advanced: 22 },
  { storytelling: 84, figurative: 58, acting: 62, structure: 70, mindset: 80, "body-language": 76, advanced: 40 },
];

export function SpectrumMorph() {
  const n = useTick(2600);
  const bars = n % 2 === 1;
  const values = SAMPLE[Math.floor(n / 2) % SAMPLE.length];
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-950 p-2">
      <div className={`absolute inset-2 flex items-center transition-opacity duration-700 ${bars ? "opacity-0" : "opacity-100"}`}>
        <SpectrumWave values={values} max={100} className="h-full w-full" />
      </div>
      <div
        className={`absolute inset-3 flex flex-col justify-center gap-1.5 transition-opacity duration-700 ${bars ? "opacity-100" : "opacity-0"}`}
      >
        {categories.map((c, i) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-[0.5rem] font-semibold" style={{ color: COLOR(c.id) }}>
              {c.short.split(" ")[0].slice(0, 5)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-700">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: bars ? `${values[c.id]}%` : "0%", background: COLOR(c.id), transitionDelay: `${i * 70}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
