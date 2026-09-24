"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShapeOnPlinth } from "@/components/trophy-shapes";
import { trophyColor } from "@/components/trophy-stand";
import { ChevronDownIcon, LockIcon } from "@/components/icons";

// The trophy room: one trophy in the spotlight, the rest receding into
// the dark on either side.
//
// WHY THIS AND NOT A SHELF. Forty-four trophies laid out in a grid is
// an inventory screen - a wall of small things, none of which feels
// like an achievement, and the eye slides straight off it. The thing
// that makes a trophy feel won is being LOOKED AT: one object, lit,
// with everything else in the room dropped away into the dark. A grid
// gives every trophy 1/44th of the attention. A spotlight gives the
// one you are on all of it, and the other forty-three become the
// reason it matters - you can see them out there in the gloom, waiting.
//
// HOW THE DEPTH IS FAKED. Every trophy sits on the same spot and is
// pushed out from centre with a translate, scaled down and dimmed by
// how far from centre it is, with a blur that grows with distance.
// Pure transform and opacity, so the whole rack is composited and the
// travel between trophies costs the main thread nothing - which after
// the animation audit is a rule around here rather than a nicety.

export interface SpotlightTrophy {
  id: string;
  icon: string;
  name: string;
  how: string;
  won: boolean;
}

/** How far each step to the side moves, scales, dims and blurs. */
const STEP_X = 168;
const STEP_SCALE = 0.34;
const STEP_BLUR = 2.6;
/** Past this many either side, a trophy is not worth painting. */
const VISIBLE = 4;

export function TrophySpotlight({
  trophies,
  backdrop,
  start = 0,
}: {
  trophies: SpotlightTrophy[];
  /** The rendered stage behind it, if there is one. */
  backdrop?: string;
  start?: number;
}) {
  const [at, setAt] = useState(start);
  const frame = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (delta: number) => setAt((i) => Math.min(trophies.length - 1, Math.max(0, i + delta))),
    [trophies.length],
  );

  // Arrow keys, once the rack has focus. A gallery you cannot arrow
  // through is a gallery that fights the one instinct people have.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go]);

  // A swipe on a phone, where there are no arrow keys and reaching for
  // a chevron with a thumb is the long way round.
  const touch = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current === null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  const here = trophies[at];
  const color = here ? `var(--color-${trophyColor(here.id)})` : "var(--color-figurative)";

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        ref={frame}
        tabIndex={0}
        role="group"
        aria-label="Trophy case"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative h-[21rem] w-full overflow-hidden rounded-3xl border border-navy-700 outline-none focus-visible:ring-2 focus-visible:ring-figurative sm:h-[24rem]"
        style={{ background: "radial-gradient(120% 90% at 50% 8%, #101a33 0%, #070c18 45%, #03060d 100%)" }}
      >
        {/* The rendered stage, if one has been made. It sits under
            everything and is deliberately dim - it is a room, not a
            picture, and the trophy has to stay the brightest thing. */}
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdrop} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full object-cover opacity-55" />
        )}

        {/* The beam. A cone from above, tinted with the trophy's own
            color so the whole room changes as you travel along it. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-[background] duration-500"
          style={{
            background: `
              radial-gradient(38% 68% at 50% -6%, color-mix(in oklab, ${color} 30%, transparent), transparent 70%),
              radial-gradient(22% 30% at 50% 78%, color-mix(in oklab, ${color} 26%, transparent), transparent 72%)
            `,
          }}
        />
        {/* The hard edges of the cone, so it reads as a beam of light
            in haze rather than a soft vignette. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[78%] w-[62%] -translate-x-1/2 opacity-40 blur-xl"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.04) 70%, transparent)",
            clipPath: "polygon(41% 0%, 59% 0%, 84% 100%, 16% 100%)",
          }}
        />

        {/* The rack. */}
        <div className="absolute inset-0">
          {trophies.map((t, i) => {
            const d = i - at;
            const away = Math.abs(d);
            if (away > VISIBLE) return null;
            const scale = Math.max(0.18, 1 - away * STEP_SCALE);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setAt(i)}
                tabIndex={away === 0 ? 0 : -1}
                aria-current={away === 0 ? "true" : undefined}
                aria-label={t.name}
                className="absolute left-1/2 top-1/2 origin-center transition-all duration-500 ease-out"
                style={{
                  transform: `translate(-50%, -46%) translateX(${d * STEP_X}px) scale(${scale})`,
                  opacity: away === 0 ? 1 : Math.max(0.1, 0.5 - away * 0.12),
                  filter: away === 0 ? "none" : `blur(${away * STEP_BLUR}px) saturate(${Math.max(0.2, 1 - away * 0.3)})`,
                  zIndex: 20 - away,
                  cursor: away === 0 ? "default" : "pointer",
                }}
              >
                <ShapeOnPlinth id={t.id} icon={t.icon} won={t.won} size={away === 0 ? 132 : 120} />
              </button>
            );
          })}
        </div>

        {/* The floor the light pools on. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: "linear-gradient(180deg, transparent, rgba(3,6,13,0.92))" }}
        />

        {/* Travel. Big targets, out of the way of the trophy. */}
        {at > 0 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous trophy"
            className="absolute left-2 top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-navy-600 bg-navy-900/80 text-ink-muted backdrop-blur transition-colors hover:text-ink"
          >
            <ChevronDownIcon className="size-5 rotate-90" />
          </button>
        )}
        {at < trophies.length - 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next trophy"
            className="absolute right-2 top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-navy-600 bg-navy-900/80 text-ink-muted backdrop-blur transition-colors hover:text-ink"
          >
            <ChevronDownIcon className="size-5 -rotate-90" />
          </button>
        )}
      </div>

      {/* Who is standing in the light. Fixed height so the case does
          not jump as you travel between a short name and a long one. */}
      {here && (
        <div className="flex min-h-[5.5rem] flex-col items-center gap-1.5 text-center">
          <span className="flex items-center gap-2">
            {!here.won && <LockIcon className="size-4 text-ink-faint" />}
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: here.won ? color : "var(--color-ink-faint)" }}
            >
              {here.name}
            </span>
          </span>
          {here.how && <span className="max-w-sm text-sm text-ink-muted text-balance">{here.how}</span>}
          <span className="text-xs tabular-nums text-ink-faint">
            {at + 1} of {trophies.length}
            {here.won ? " · awarded" : " · not yet"}
          </span>
        </div>
      )}
    </div>
  );
}
