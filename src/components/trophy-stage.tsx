"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon, LockIcon, ZoomIcon } from "@/components/icons";
import { TrophyZoom } from "@/components/trophy-zoom";
import { StageBackdrop } from "@/components/stage-backdrop";

// One trophy, standing on the podium, under the light.
//
// WHY THE TROPHY HAS TO STAND ON SOMETHING. The first trophy room laid
// the renders over the stage photograph at whatever height the rack
// put them, so the plinth hung in front of the podium rather than on
// it - a cut-out held up to a picture of a stage. The eye reads that
// instantly as two things pasted together. A trophy that is actually
// standing on the lit disc, with its reflection in the floor, is one
// object in one room, and that is the whole difference between a
// prize and an icon.
//
// HOW IT STAYS STANDING AT EVERY SIZE. Every position here is a share
// of the frame's HEIGHT, and the frame is never wider than the stage
// photograph (1600x893). object-cover then only ever crops the sides,
// so the disc sits at the same height in the frame on a phone and on a
// desktop, and the plinth lands on it at both.

/** Where the lit disc is, as a share of the frame height, measured off
 *  stage.jpg: the spot the beam lands on is centred at 68%. */
const DISC_Y = 0.7;
/** How tall the trophy stands, as a share of the frame. */
const TROPHY_H = 0.6;
const TROPHY_H_PHONE = 0.5;
/** The renders carry a little black under the plinth (10-23px of 398);
 *  this much of the image is below the base and sinks into the floor. */
const BASE_PAD = 0.04;

/** Where the neighbours stand, by distance from the one in the light:
 *  across (share of the frame's width), up the stage (share of its
 *  height - further back is higher), size, and how far into the dark.
 *  Index 0 is the trophy in the beam. */
interface Slot { x: number; lift: number; scale: number; opacity: number; blur: number; dim: number }
const RACK_WIDE: Slot[] = [
  { x: 0, lift: 0, scale: 1, opacity: 1, blur: 0, dim: 1 },
  { x: 0.26, lift: 0.05, scale: 0.6, opacity: 0.62, blur: 1.2, dim: 0.55 },
  { x: 0.41, lift: 0.085, scale: 0.44, opacity: 0.4, blur: 2.4, dim: 0.42 },
  { x: 0.52, lift: 0.11, scale: 0.34, opacity: 0.24, blur: 3.6, dim: 0.35 },
];
/** On a phone the frame is tall and narrow, so the neighbours stand in
 *  close - tucked partly behind the one in the light - rather than
 *  pushed out to edges they would fall off. */
const RACK_PHONE: Slot[] = [
  { x: 0, lift: 0, scale: 1, opacity: 1, blur: 0, dim: 1 },
  { x: 0.3, lift: 0.045, scale: 0.6, opacity: 0.7, blur: 1, dim: 0.5 },
  { x: 0.44, lift: 0.08, scale: 0.42, opacity: 0.42, blur: 2, dim: 0.4 },
];

export interface StageTrophy {
  id: string;
  name: string;
  how: string;
  won: boolean;
  image: string;
  zoom?: string;
  /** The skill colour it was rendered in - the same one the render
   *  carries, rather than one derived from the id. */
  color: string;
  /** The material, which is the rank - shown under the name. */
  material?: string;
}

export function TrophyStage({
  trophies,
  at,
  onGo,
}: {
  trophies: StageTrophy[];
  at: number;
  onGo: (i: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  const [w, setW] = useState(0);

  // The zoom wants a height in pixels, and the frame's height changes
  // with the width of the screen.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setH(e.contentRect.height);
      setW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (delta: number) => onGo(Math.min(trophies.length - 1, Math.max(0, at + delta))),
    [at, onGo, trophies.length],
  );

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

  const touch = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current === null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  const here = trophies[at];
  if (!here) return null;
  const color = `var(--color-${here.color})`;
  // The rack for this screen: close and overlapping on a phone, where
  // the frame is tall and narrow and the neighbours are what make it
  // feel like a room; wider apart on a laptop, where there is room.
  const phone = w > 0 && w < 640;
  const rack = phone ? RACK_PHONE : RACK_WIDE;
  // A little smaller on a phone, so the neighbours are not crowded out
  // of a frame that is only so wide.
  const th = phone ? TROPHY_H_PHONE : TROPHY_H;
  const trophyPx = Math.round(h * th);

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        ref={frame}
        tabIndex={0}
        role="group"
        aria-label="Trophy stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-3xl border border-navy-700 bg-[#03060d] outline-none focus-visible:ring-2 focus-visible:ring-figurative sm:aspect-[1600/893]"
      >
        {/* The room. Full strength - it is a dark photograph already,
            and dimming it again took the podium away with it. The smoke
            in the beam moves (stage-backdrop.tsx). */}
        <StageBackdrop poster="/trophy/stage.jpg" video="/trophy/stage-smoke-v2.mp4" />

        {/* What the trophy throws onto the disc around it. The lamp
            stays warm white; the colour belongs to the object. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-[background] duration-500"
          style={{
            background: `radial-gradient(34% 12% at 50% ${DISC_Y * 100}%, color-mix(in oklab, ${here.won ? color : "#000"} 30%, transparent), transparent 75%)`,
          }}
        />

        {/* Its reflection in the wet floor, below the base. Keyed so it
            arrives with the trophy rather than ahead of it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${here.id}-reflection`}
          src={here.image}
          alt=""
          aria-hidden
          className="trophy-arrive pointer-events-none absolute left-1/2"
          style={{
            height: `${th * 100}%`,
            top: `${(DISC_Y - th * BASE_PAD) * 100}%`,
            transform: "translateX(-50%) scaleY(-1)",
            opacity: here.won ? 0.22 : 0.08,
            filter: here.won ? "blur(1.5px)" : "grayscale(1) blur(1.5px)",
            maskImage: "linear-gradient(to top, black, transparent 45%)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent 45%)",
          }}
        />

        {/* The rack: the one in the light, set down on the disc, and
            the others standing back in the dark on either side. Every
            trophy keeps its own element as it moves, so stepping to the
            next one slides the whole row - the new one comes forward
            into the beam, the last one steps back out of it. Transform,
            opacity and filter, so the compositor does the travelling. */}
        {h > 0 &&
          trophies.map((t, i) => {
            const d = i - at;
            const away = Math.abs(d);
            if (away > rack.length - 1) return null;
            const slot = rack[away];
            const x = Math.sign(d) * slot.x * w;
            const lift = slot.lift * h;
            const centre = away === 0;
            return (
              <div
                key={t.id}
                className="absolute left-1/2 origin-bottom transition-[transform,opacity,filter] duration-700 ease-out"
                style={{
                  bottom: `${(1 - DISC_Y - th * BASE_PAD) * 100}%`,
                  transform: `translateX(-50%) translateX(${x}px) translateY(${-lift}px) scale(${slot.scale})`,
                  opacity: centre ? 1 : slot.opacity,
                  filter: centre ? "none" : `blur(${slot.blur}px) brightness(${slot.dim})`,
                  zIndex: 20 - away,
                }}
              >
                {centre ? (
                  <TrophyZoom src={t.image} zoomSrc={t.zoom} alt={t.name} height={trophyPx} dimmed={!t.won} />
                ) : (
                  <button
                    type="button"
                    onClick={() => onGo(i)}
                    tabIndex={-1}
                    aria-label={t.name}
                    className="block cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.image}
                      alt=""
                      draggable={false}
                      style={{ height: trophyPx, width: "auto" }}
                      className={t.won ? "" : "opacity-50 grayscale"}
                    />
                  </button>
                )}
              </div>
            );
          })}

        {at > 0 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous trophy"
            className="absolute bottom-4 left-3 z-30 grid size-11 place-items-center sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 rounded-full border border-navy-600 bg-navy-900/80 text-ink-muted backdrop-blur transition-colors hover:text-ink"
          >
            <ChevronDownIcon className="size-5 rotate-90" />
          </button>
        )}
        {at < trophies.length - 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next trophy"
            className="absolute bottom-4 right-3 z-30 grid size-11 place-items-center sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 rounded-full border border-navy-600 bg-navy-900/80 text-ink-muted backdrop-blur transition-colors hover:text-ink"
          >
            <ChevronDownIcon className="size-5 -rotate-90" />
          </button>
        )}
      </div>

      {/* Fixed height so the page does not jump between a short name
          and a long one. */}
      <div className="flex min-h-[6rem] flex-col items-center gap-1.5 text-center">
        <span className="flex items-center gap-2">
          {!here.won && <LockIcon className="size-4 text-ink-faint" />}
          <span className="text-2xl font-bold tracking-tight" style={{ color: here.won ? color : "var(--color-ink-faint)" }}>
            {here.name}
          </span>
        </span>
        {here.how && <span className="max-w-sm text-sm text-ink-muted text-balance">{here.how}</span>}
        <span className="text-xs tabular-nums text-ink-faint">
          {here.material && <span className="capitalize">{here.material} · </span>}
          {at + 1} of {trophies.length}
          {here.won ? " · awarded" : " · not yet"}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-faint">
          <ZoomIcon className="size-3.5" />
          Press and drag on the trophy to look closer
        </span>
      </div>
    </div>
  );
}
