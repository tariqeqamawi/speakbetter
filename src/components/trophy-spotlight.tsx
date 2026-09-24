"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlinthMount } from "@/components/trophy-mounts";
import { trophyColor } from "@/components/trophy-stand";
import { ChevronDownIcon, LockIcon } from "@/components/icons";
import { LightBeam } from "@/components/light-beam";
import { TrophyZoom } from "@/components/trophy-zoom";

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
  /** A rendered trophy, cut out on transparency. When one exists it is
   *  the trophy; the drawn plinth is what stands in until it does.
   *  Sculpted objects survive being lit far better than flat symbols,
   *  which is the whole argument for rendering them. */
  image?: string;
  /** The same render, larger, for looking at closely. Fetched only
   *  when somebody leans in. */
  zoom?: string;
}

/** How far each step to the side moves, scales, dims and blurs.
 *  The medallion on its plinth is a wider object than a cut-out
 *  symbol, so the neighbours stand further out or they crowd the one
 *  in the light - which is the one thing this layout exists to avoid. */
const STEP_X = 210;
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

        {/* The beam, and the pool where it lands. Warm white, always.
            
            This used to take the colour of whichever trophy was
            standing in it, which sounded good and looked wrong: when
            the light and the object shift hue together the whole frame
            just tints, and every trophy ends up looking like the same
            trophy in a different filter. A stage lamp is one
            temperature all night. The CONTRAST between a fixed warm
            light and a coloured object is the thing that makes a lit
            trophy read as precious. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(38% 68% at 50% -6%, rgba(var(--lamp), 0.22), transparent 70%),
              radial-gradient(22% 30% at 50% 78%, rgba(var(--lamp), 0.18), transparent 72%)
            `,
          }}
        />
        {/* What the trophy itself throws back into the room - this is
            where the colour belongs, and it still changes as you
            travel. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-[background] duration-500"
          style={{
            background: `radial-gradient(30% 34% at 50% 54%, color-mix(in oklab, ${color} 24%, transparent), transparent 72%)`,
          }}
        />
        {/* The shaft itself - hard-edged, with smoke and dust in it,
            which is the only reason a beam is visible at all. */}
        <LightBeam height="88%" />

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
                {t.image ? (
                  away === 0 ? (
                    // Only the one in the light can be inspected. The
                    // others are blurred and half a size down; a zoom
                    // on those would be a magnified blur.
                    <TrophyZoom
                      src={t.image}
                      zoomSrc={t.zoom}
                      alt={t.name}
                      height={250}
                      dimmed={!t.won}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.image}
                      alt=""
                      style={{ height: 230, width: "auto" }}
                      // Not-yet-won trophies go dark and grey, the way
                      // an empty slot in a real case reads.
                      className={t.won ? "" : "opacity-40 grayscale"}
                    />
                  )
                ) : (
                  <PlinthMount id={t.id} icon={t.icon} won={t.won} size={away === 0 ? 118 : 108} />
                )}
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
