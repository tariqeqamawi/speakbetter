"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RoarMark } from "@/components/roar-mark";

// "Speak Better Is Perfect For..." and then the people it's for, one at a
// time: the name cascading in, letter by letter, a line on what they want
// from it, and their photo large beside it. It moves on by itself once
// it's on screen, waits while the mouse is over it, and the bars under
// the line jump straight to anyone. On a phone a thumb swipe steps
// through them too.

const ROLES = [
  {
    who: "Entrepreneurs",
    pic: "entrepreneur",
    color: "var(--color-figurative)",
    line: "You want to talk about your products and services seamlessly.",
  },
  {
    who: "Founders",
    pic: "founder",
    color: "var(--color-structure)",
    line: "You want to share your ideas and rally support.",
  },
  {
    who: "Coaches",
    pic: "coach",
    color: "var(--color-mindset)",
    line: "You want to speak more clearly on your video calls.",
  },
  {
    who: "Influencers",
    pic: "influencer",
    color: "var(--color-storytelling)",
    line: "You want to share your stories in a way that's engaging.",
  },
  {
    who: "Podcasters",
    pic: "podcaster",
    color: "var(--color-body-language)",
    line: "You want your interviews to sound more natural and engaging.",
  },
  {
    who: "Teachers",
    pic: "teacher",
    color: "var(--color-voice)",
    line: "You want to explain concepts in ways that land.",
  },
];

const STEP = 3600; // ms each person is shown

export function PerfectFor() {
  const ref = useRef<HTMLElement>(null);
  const [at, setAt] = useState(0);
  // A thumb swipe: where it started, to tell a sideways flick from a
  // scroll down the page.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const step = (by: number) =>
    setAt((i) => (i + by + ROLES.length) % ROLES.length);
  const [seen, setSeen] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen || held) return;
    const t = setTimeout(() => setAt((i) => (i + 1) % ROLES.length), STEP);
    return () => clearTimeout(t);
  }, [at, seen, held]);

  const role = ROLES[at];

  return (
    <section
      ref={ref}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const from = touch.current;
        touch.current = null;
        if (!from) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - from.x;
        const dy = t.clientY - from.y;
        // Sideways and far enough to mean it - not a scroll.
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5)
          step(dx < 0 ? 1 : -1);
      }}
      className="mx-auto grid w-full max-w-6xl touch-pan-y items-center gap-8 lg:grid-cols-2 lg:gap-14"
    >
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <RoarMark className="mb-4 h-20 w-auto sm:h-24" />
        <h2 className="flex flex-col items-center gap-1 lg:items-start">
          <span className="text-2xl font-semibold tracking-tight text-ink-muted sm:text-3xl">
            Speak Better is perfect for
          </span>
          <span
            key={role.who}
            className="text-5xl font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl"
            style={{
              textShadow: `0 0 28px color-mix(in oklab, ${role.color} 45%, transparent)`,
            }}
          >
            <span className="sr-only">{role.who}</span>
            <span aria-hidden>
              {[...role.who].map((ch, i) => (
                <span
                  key={i}
                  className="cascade-letter"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {ch}
                </span>
              ))}
            </span>
          </span>
        </h2>
        <p
          key={role.line}
          className="cascade-fade mt-4 min-h-[3.5em] max-w-md text-lg text-ink-muted text-pretty sm:text-xl"
        >
          {role.line}
        </p>
        <div
          className="mt-4 flex gap-2"
          role="tablist"
          aria-label="Who it's for"
        >
          {ROLES.map((r, i) => (
            <button
              key={r.who}
              type="button"
              role="tab"
              aria-selected={i === at}
              aria-label={r.who}
              onClick={() => setAt(i)}
              className="group py-2"
            >
              <span
                className="block h-1.5 w-8 rounded-full bg-navy-600 transition-colors duration-300 group-hover:bg-ink-faint sm:w-10"
                style={
                  i === at
                    ? { background: r.color, boxShadow: `0 0 10px ${r.color}` }
                    : undefined
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-navy-600 shadow-2xl shadow-navy-950/80">
        {ROLES.map((r, i) => (
          <Image
            key={r.pic}
            src={`/landing/for-${r.pic}.webp`}
            alt={i === at ? `${r.who} speaking` : ""}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className={`object-cover transition-opacity duration-700 ${i === at ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 transition-colors duration-700"
          style={{
            background: role.color,
            boxShadow: `0 0 18px ${role.color}`,
          }}
        />
      </div>
    </section>
  );
}
