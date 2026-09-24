"use client";

import { useEffect, useRef } from "react";
import { CheckIcon, LockIcon, ProfileIcon, TrophyIcon, ZapIcon } from "@/components/icons";

// The road, walked.
//
// Drawn perspective rather than a tilted plane, for one reason that
// decides it: the checkpoints are UPRIGHT. They are discs standing on
// the road facing the walker, not discs lying flat on it - so they
// stay round, stay readable, and stay honest targets under a thumb.
// The ground behind them recedes; the things standing on it do not
// lean back with it.
//
// Depth comes from position on screen. A stop near the bottom of the
// viewport is near you and large; the further up the screen it sits,
// the further away it is, so it shrinks and fades. Scrolling therefore
// IS walking: the next stop grows out of the distance, swells as it
// comes to meet you, and slides past.
//
// And the stops are far apart on purpose. A challenge a thumb-flick
// away is a list; a challenge that takes a moment to reach is a
// journey - and the ground in between is where the trophies, the
// scores and the coach's lines about that take belong.

export interface WalkStop {
  n: number;
  title: string;
  state: "done" | "here" | "ahead" | "locked";
  /** What sits on the road between this stop and the next. */
  marker?: { kind: "trophy" | "note" | "xp"; text: string };
}

/** How much road each stop gets. Tall enough that reaching the next
 *  one is a deliberate scroll rather than a flick. */
const STRIDE = 300;

export function RoadWalk({ stops, accent = "var(--color-mindset)" }: { stops: WalkStop[]; accent?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let raf = 0;

    const draw = () => {
      raf = 0;
      const box = frame.getBoundingClientRect();
      // Where the walker stands: low in the frame. Everything above
      // this line is ahead of them, and recedes.
      const eye = box.top + box.height * 0.88;
      for (const row of rowsRef.current) {
        if (!row) continue;
        const r = row.getBoundingClientRect();
        const centre = r.top + r.height / 2;
        // 0 at the walker's feet, 1 at the horizon.
        const depth = Math.max(0, Math.min(1, (eye - centre) / (box.height * 0.95)));
        // Shrinks fast at first, then levels off - true linear
        // perspective makes the far stops unreadable long before they
        // feel distant.
        const scale = 1 - 0.66 * Math.pow(depth, 0.72);
        const fade = 1 - 0.62 * depth;
        row.style.transform = `scale(${scale.toFixed(3)})`;
        row.style.opacity = fade.toFixed(3);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [stops.length]);

  // Nearest first down the page: the walker is at the bottom.
  const walk = [...stops].reverse();

  return (
    <div ref={frameRef} className="relative">
      {/* The ground: a road tapering to a vanishing point, fixed
          behind the stops so it does not scroll with them - which is
          what makes the stops read as moving THROUGH it. */}
      <span
        aria-hidden
        className="pointer-events-none sticky top-0 -mb-[100vh] block h-screen w-full"
        style={{
          background: `
            radial-gradient(70% 34% at 50% 6%, color-mix(in oklab, ${accent} 26%, transparent), transparent 70%),
            linear-gradient(0deg, color-mix(in oklab, ${accent} 12%, transparent), transparent 62%)
          `,
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            clipPath: "polygon(50% 8%, 50% 8%, 96% 100%, 4% 100%)",
            background: `linear-gradient(0deg, color-mix(in oklab, ${accent} 20%, transparent), transparent 76%)`,
          }}
        />
        <span
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: [
              `repeating-radial-gradient(ellipse at 50% 50%, ${accent} 0 1px, transparent 1px 24px)`,
              `repeating-radial-gradient(ellipse at 50% 50%, ${accent} 0 1px, transparent 1px 19px)`,
            ].join(", "),
            backgroundRepeat: "no-repeat",
            backgroundSize: "52% 26%, 40% 22%",
            backgroundPosition: "2% 70%, 94% 46%",
            maskImage: "linear-gradient(0deg, #000 30%, transparent 86%)",
            WebkitMaskImage: "linear-gradient(0deg, #000 30%, transparent 86%)",
          }}
        />
      </span>

      <div className="relative flex flex-col">
        {walk.map((stop, i) => (
          <div
            key={stop.n}
            ref={(el) => {
              rowsRef.current[i] = el;
            }}
            className="flex flex-col items-center justify-center will-change-transform"
            style={{ height: STRIDE, transformOrigin: "50% 100%" }}
          >
            <Upright stop={stop} accent={accent} />
            {stop.marker && <Marker marker={stop.marker} accent={accent} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A checkpoint, standing up on the road rather than lying on it. */
function Upright({ stop, accent }: { stop: WalkStop; accent: string }) {
  const dim = stop.state === "locked";
  return (
    <span className="flex items-center gap-3">
      <span className="relative block size-[104px] shrink-0">
        {stop.state === "here" && (
          <span aria-hidden className="here-ring pointer-events-none absolute -inset-2 z-20 rounded-full" />
        )}
        <span
          className="grid size-full place-items-center overflow-hidden rounded-full border-2"
          style={{
            borderColor: dim ? "#26304f" : accent,
            background: dim ? "#0c1222" : "#101a2e",
            boxShadow: dim ? "none" : `0 0 34px -10px ${accent}, 0 18px 26px -18px rgba(0,0,0,0.95)`,
          }}
        >
          <span className="grid size-10 place-items-center">
            {stop.state === "locked" ? (
              <LockIcon className="size-full text-ink-faint" />
            ) : stop.state === "here" ? (
              <ProfileIcon className="size-full text-ink-muted" />
            ) : (
              <CheckIcon className="size-full text-mindset" />
            )}
          </span>
        </span>
        {/* The shadow it casts on the road - the only thing that lies
            flat, which is what tells you the disc is standing up. */}
        <span
          aria-hidden
          className="absolute -bottom-2 left-1/2 h-3 w-[86%] -translate-x-1/2 rounded-[50%] blur-[3px]"
          style={{ background: dim ? "rgba(10,16,32,0.9)" : accent, opacity: dim ? 0.5 : 0.35 }}
        />
        <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-navy-950 text-xs font-bold text-ink-muted">
          {stop.n}
        </span>
      </span>
      <span className="max-w-[10rem]">
        <span className={`block text-base font-semibold leading-tight ${dim ? "text-ink-faint" : "text-ink"}`}>
          {stop.title}
        </span>
      </span>
    </span>
  );
}

/** What sits on the ground between one challenge and the next - the
 *  reason the stops are far apart. */
function Marker({ marker, accent }: { marker: NonNullable<WalkStop["marker"]>; accent: string }) {
  if (marker.kind === "trophy")
    return (
      <span className="mt-6 flex items-center gap-2 rounded-full border border-advanced/50 bg-navy-900/70 px-3 py-1.5 text-xs font-semibold text-advanced backdrop-blur">
        <TrophyIcon className="size-4" />
        {marker.text}
      </span>
    );
  if (marker.kind === "xp")
    return (
      <span
        className="mt-6 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold tabular-nums backdrop-blur"
        style={{ borderColor: `color-mix(in oklab, ${accent} 50%, transparent)`, color: accent, background: "rgba(8,13,26,0.7)" }}
      >
        <ZapIcon className="size-3.5" />
        {marker.text}
      </span>
    );
  return (
    <span className="mt-6 max-w-[15rem] rounded-xl border border-navy-600 bg-navy-900/70 px-3 py-2 text-center text-xs italic leading-snug text-ink-muted backdrop-blur">
      &ldquo;{marker.text}&rdquo;
    </span>
  );
}
