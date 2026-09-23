"use client";

import { useEffect, useRef, useState } from "react";
import { storyPhases } from "@/data/challenges";
import { CheckIcon, LockIcon, ProfileIcon } from "@/components/icons";

// A bench for the road, before it is built.
//
// The question is whether the journey should run BOTTOM TO TOP with
// real depth - the checkpoint you are standing on nearest and largest,
// the rest shrinking away up the road - instead of a flat list walked
// downwards. Two ways to do that, drawn here at the size a phone
// actually renders them, so the choice can be made by looking rather
// than by imagining.
//
// Nothing here is wired to a student's record: it is six stops of
// scenery.

interface Stop {
  n: number;
  title: string;
  state: "done" | "here" | "ahead" | "locked";
}

const STOPS: Stop[] = [
  { n: 1, title: "Record Your Speaking Baseline", state: "done" },
  { n: 2, title: "Tell a Story Without Any Help", state: "done" },
  { n: 3, title: "Watch All The Confidence & Presence Skills", state: "here" },
  { n: 4, title: "No Filler Words", state: "ahead" },
  { n: 5, title: "Find Your Resonance", state: "ahead" },
  { n: 6, title: "Narrate A Scene From Your Day", state: "locked" },
];

const GREEN = "var(--color-mindset)";

/**
 * A - DRAWN PERSPECTIVE.
 *
 * No 3D transform: each stop is given its own scale, opacity and
 * horizontal drift from how far up the road it is. Text stays crisp
 * because nothing is rotated, and the curve of the recession is ours
 * to shape - which matters, because true linear perspective makes the
 * fifth stop too small to read long before it is far enough away to
 * feel distant.
 */
export function RoadDrawn() {
  const rows = [...STOPS].reverse(); // nearest first, drawn bottom-up
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy-950" style={{ height: 620 }}>
      <Horizon />
      <Contours />
      {/* the road itself, tapering to the vanishing point */}
      <span
        aria-hidden
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: "72%",
          height: "100%",
          clipPath: "polygon(50% 0%, 50% 0%, 100% 100%, 0% 100%)",
          background: `linear-gradient(0deg, color-mix(in oklab, ${GREEN} 22%, transparent), transparent 72%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col-reverse justify-start px-4 pb-5">
        {rows.map((stop, i) => {
          // i = 0 is nearest. Scale falls away fast at first and then
          // levels off, so the far stops stay legible.
          const depth = i / (rows.length - 1);
          const scale = 1 - 0.62 * Math.pow(depth, 0.78);
          const fade = 1 - 0.55 * depth;
          const drift = (i % 2 === 0 ? -1 : 1) * 14 * (1 - depth);
          return (
            <div
              key={stop.n}
              className="flex items-center justify-center"
              style={{
                height: 118 * scale + 12,
                transform: `translateX(${drift}px)`,
                opacity: fade,
              }}
            >
              <Stop stop={stop} size={104 * scale} showLabel={depth < 0.75} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * B - A TILTED PLANE.
 *
 * The road is one plane laid back in 3D, the way it is today, but
 * anchored at the bottom so everything recedes upward. Cheaper - the
 * browser does the maths - and the ground, the contours and the trail
 * all recede together, which drawn perspective has to fake. The cost
 * is that text on the plane is being rendered at an angle, so it
 * softens as it goes back.
 */
export function RoadTilted() {
  const ref = useRef<HTMLDivElement>(null);
  const [lean, setLean] = useState(44);
  useEffect(() => {
    // Nothing clever - just lets the bench show a few angles.
    const id = window.setInterval(() => setLean((l) => (l >= 50 ? 38 : l + 2)), 1800);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy-950" style={{ height: 620 }}>
      <Horizon />
      <div
        ref={ref}
        className="absolute inset-x-0 bottom-0"
        style={{
          height: 900,
          transform: `perspective(760px) rotateX(${lean}deg)`,
          transformOrigin: "50% 100%",
        }}
      >
        <Contours />
        <span
          aria-hidden
          className="absolute inset-x-[22%] bottom-0 top-0"
          style={{ background: `linear-gradient(0deg, color-mix(in oklab, ${GREEN} 18%, transparent), transparent 70%)` }}
        />
        <div className="absolute inset-0 flex flex-col-reverse justify-start gap-10 px-6 pb-6">
          {[...STOPS].reverse().map((stop) => (
            <div key={stop.n} className="flex items-center justify-center">
              <span style={{ transform: `rotateX(-${lean}deg)`, transformOrigin: "50% 100%" }}>
                <Stop stop={stop} size={92} showLabel />
              </span>
            </div>
          ))}
        </div>
      </div>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-navy-900/80 px-3 py-1 text-[0.65rem] text-ink-faint backdrop-blur">
        tilt cycling {lean}&deg;
      </span>
    </div>
  );
}

function Stop({ stop, size, showLabel }: { stop: Stop; size: number; showLabel: boolean }) {
  const dim = stop.state === "locked";
  return (
    <span className="flex items-center gap-3">
      <span className="relative block shrink-0" style={{ width: size, height: size }}>
        {stop.state === "here" && (
          <span aria-hidden className="here-ring pointer-events-none absolute -inset-1.5 z-20 rounded-full" />
        )}
        <span
          className="grid size-full place-items-center overflow-hidden rounded-full border-2"
          style={{
            borderColor: dim ? "#26304f" : GREEN,
            background: dim ? "#0c1222" : "#101a2e",
            boxShadow: dim ? "none" : `0 0 ${size * 0.3}px -${size * 0.12}px ${GREEN}`,
          }}
        >
          <span
            className="grid place-items-center"
            style={{ width: size * 0.4, height: size * 0.4 }}
          >
            {stop.state === "locked" ? (
              <LockIcon className="size-full text-ink-faint" />
            ) : stop.state === "here" ? (
              <ProfileIcon className="size-full text-ink-muted" />
            ) : (
              <CheckIcon className="size-full text-mindset" />
            )}
          </span>
        </span>
        <span
          className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-navy-950 text-[0.6rem] font-bold text-ink-muted"
          style={{ width: size * 0.3, height: size * 0.3, fontSize: Math.max(9, size * 0.16) }}
        >
          {stop.n}
        </span>
      </span>
      {showLabel && (
        <span
          className="max-w-[9rem] font-semibold leading-tight"
          style={{ fontSize: Math.max(10, size * 0.15), color: dim ? "#5a688f" : "#e9ecf8" }}
        >
          {stop.title}
        </span>
      )}
    </span>
  );
}

/** The light where the road runs out. */
function Horizon() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, ${GREEN} 30%, transparent), transparent 70%)` }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-x-[30%] top-8 h-px" style={{ background: GREEN, opacity: 0.35 }} />
    </>
  );
}

/** The contours, fading out as they go back. */
function Contours() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: 0.3,
        backgroundImage: [
          `repeating-radial-gradient(ellipse at 50% 50%, ${GREEN} 0 1px, transparent 1px 22px)`,
          `repeating-radial-gradient(ellipse at 50% 50%, ${GREEN} 0 1px, transparent 1px 27px)`,
          `repeating-radial-gradient(ellipse at 50% 50%, ${GREEN} 0 1px, transparent 1px 19px)`,
        ].join(", "),
        backgroundRepeat: "no-repeat",
        backgroundSize: "54% 30%, 44% 24%, 40% 26%",
        backgroundPosition: "4% 62%, 92% 40%, 30% 14%",
        maskImage: "linear-gradient(0deg, #000 40%, transparent 92%)",
        WebkitMaskImage: "linear-gradient(0deg, #000 40%, transparent 92%)",
      }}
    />
  );
}

/** What the phases would look like as a ribbon along the top. */
export function PhaseRibbon() {
  return (
    <div className="flex items-center gap-1.5">
      {storyPhases.map((p, i) => (
        <span
          key={p.id}
          className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
            i === 0 ? `${p.bgClass} text-navy-950` : `border border-current ${p.textClass} opacity-55`
          }`}
        >
          {p.id}
        </span>
      ))}
    </div>
  );
}
