"use client";

import { RoaringLion } from "@/components/roaring-lion";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categories, type CategoryId } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { CategoryIcon } from "@/components/category-icons";
import { useStore } from "@/lib/store";

// The seven colors as a dial: a ring of arcs with a node per category,
// the hovered one swelling while the center names what you're looking
// at. The grid it replaces treated the categories as a list; this treats
// them as what they are - one wheel of color with the brand at its hub.
// Click (or tap, where there is no hover) opens the category.

const NODE_ANGLE = 360 / categories.length;
/** Node centers, as percentages of the square. */
const RADIUS = 41;
/** Arc ring radius in viewBox units (100 x 100). */
const ARC_R = 41;
/** The ring's circumference and one color's length of it. */
const CIRC = 2 * Math.PI * ARC_R;
const SEGMENT = CIRC / categories.length;

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number, r: number): string {
  const a = polar(startDeg, r);
  const b = polar(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

/** Inside the /demo preview, category links stay inside the preview -
 *  the real routes are gated and would bounce a visitor to the sales
 *  page mid-browse. */
function useSkillsPrefix(): string {
  return usePathname().startsWith("/demo") ? "/demo" : "";
}

export function SkillDial() {
  const router = useRouter();
  const prefix = useSkillsPrefix();
  const { state } = useStore();
  const [hovered, setHovered] = useState<CategoryId | null>(null);
  const dialRef = useRef<HTMLDivElement>(null);

  // On touch, the dial works like a real dial: press a color and it
  // lights, slide the thumb and the highlight follows, release over a
  // color and only then does it open. Native listeners because React
  // registers touchmove as passive, and the slide has to preventDefault
  // or the page scrolls under the thumb.
  useEffect(() => {
    const dial = dialRef.current;
    if (!dial) return;
    let dialing = false;

    const catUnder = (t: Touch): CategoryId | null => {
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const node = el?.closest<HTMLElement>("[data-dial-node]");
      return (node?.dataset.dialNode as CategoryId) ?? null;
    };

    const onStart = (e: TouchEvent) => {
      const cat = catUnder(e.touches[0]);
      if (!cat) return; // a touch off the nodes scrolls the page normally
      dialing = true;
      setHovered(cat);
      e.preventDefault();
    };
    const onMove = (e: TouchEvent) => {
      if (!dialing) return;
      e.preventDefault();
      setHovered(catUnder(e.touches[0]));
    };
    const onEnd = (e: TouchEvent) => {
      if (!dialing) return;
      dialing = false;
      e.preventDefault();
      // Where the thumb lifted decides - read straight off the touch,
      // not from state, which may not have settled yet.
      const cat = catUnder(e.changedTouches[0]);
      setHovered(null);
      if (cat) router.push(`${prefix}/skills/${cat}`);
    };
    const onCancel = () => {
      dialing = false;
      setHovered(null);
    };

    dial.addEventListener("touchstart", onStart, { passive: false });
    dial.addEventListener("touchmove", onMove, { passive: false });
    dial.addEventListener("touchend", onEnd, { passive: false });
    dial.addEventListener("touchcancel", onCancel);
    return () => {
      dial.removeEventListener("touchstart", onStart);
      dial.removeEventListener("touchmove", onMove);
      dial.removeEventListener("touchend", onEnd);
      dial.removeEventListener("touchcancel", onCancel);
    };
  }, [router, prefix]);

  const active = hovered ? categories.find((c) => c.id === hovered) : null;
  const activeIndex = active ? categories.indexOf(active) : -1;
  const activeLessons = active ? lessonsInCategory(active.id) : [];
  const activeWatched = activeLessons.filter((l) =>
    state.watchedLessons.includes(l.vimeoId),
  ).length;
  const totalLessons = categories.reduce(
    (sum, c) => sum + lessonsInCategory(c.id).length,
    0,
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {/* The name of whatever the pointer is on, above the dial and in
          its color - so the hub keeps its shape whatever the length of
          the name. Held to a fixed height so the dial doesn't shift. */}
      <div className="flex h-12 flex-col items-center justify-center text-center" aria-live="polite">
        {active ? (
          <>
            <span className={`text-lg font-semibold leading-tight sm:text-xl ${active.textClass}`}>
              {active.short}
            </span>
            <span className="text-xs text-ink-muted">
              {activeLessons.length} lessons
              {activeWatched > 0 && ` · ${activeWatched} watched`}
              <span className="text-ink-faint"> · tap to open</span>
            </span>
          </>
        ) : (
          <>
            <span className="text-lg font-semibold text-ink sm:text-xl">Seven colors</span>
            <span className="text-xs text-ink-muted">{totalLessons} lessons · pick where to dip in</span>
          </>
        )}
      </div>
    <div
      ref={dialRef}
      className="relative mx-auto aspect-square w-full max-w-xl select-none touch-pan-y"
    >
      {/* The ring: the seven colors joined end to end, faint, and one
          bright length of it - the color under the pointer - that slides
          round to the next color rather than jumping: a dashed circle
          whose dash is one segment long and whose offset is animated. */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {categories.map((cat, i) => (
          <path
            key={cat.id}
            d={arcPath(i * NODE_ANGLE, (i + 1) * NODE_ANGLE, ARC_R)}
            fill="none"
            stroke={`var(--color-${cat.id})`}
            strokeWidth={1}
            opacity={hovered ? 0.18 : 0.3}
            className="transition-opacity duration-300"
          />
        ))}
        <circle
          cx="50"
          cy="50"
          r={ARC_R}
          fill="none"
          stroke={active ? `var(--color-${active.id})` : "transparent"}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray={`${SEGMENT} ${CIRC - SEGMENT}`}
          strokeDashoffset={-(activeIndex < 0 ? 0 : activeIndex) * SEGMENT}
          opacity={active ? 0.95 : 0}
          transform="rotate(-90 50 50)"
          className="dial-sweep"
        />
      </svg>

      {/* The hub: the lion, ringed in the color the pointer is on. It
          holds its shape - the naming happens above the dial. */}
      <div
        className={`absolute left-1/2 top-1/2 flex aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border bg-navy-800/90 transition-[border-color,box-shadow,color] duration-300 ${
          active
            ? `border-current ${active.textClass} shadow-[0_0_36px_-6px_currentColor]`
            : "border-navy-600 shadow-[0_0_0_0_transparent]"
        }`}
      >
        <RoaringLion className="w-[82%] translate-y-[3%]" />
      </div>

      {/* The nodes */}
      {/* (chips live in CategoryChips below, sharing the same prefix) */}
      {categories.map((cat, i) => {
        const pos = polar(i * NODE_ANGLE + NODE_ANGLE / 2, RADIUS);
        const lit = hovered === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            data-dial-node={cat.id}
            aria-label={`${cat.name} - open lessons`}
            onMouseEnter={() => setHovered(cat.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(cat.id)}
            onBlur={() => setHovered(null)}
            onClick={() => router.push(`${prefix}/skills/${cat.id}`)}
            className={`absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-navy-800 transition-all duration-300 sm:size-[4.5rem] ${cat.textClass} ${
              lit
                ? "z-10 scale-125 border-current shadow-[0_0_24px_-4px_currentColor]"
                : "border-navy-600 hover:border-current"
            }`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <CategoryIcon
              category={cat.id}
              className={`transition-transform duration-300 ${lit ? "size-8 sm:size-9" : "size-6 sm:size-7"}`}
            />
          </button>
        );
      })}
    </div>
    </div>
  );
}

/** The same seven doors as a plain row - for touch screens, where the
 *  dial's hover preview doesn't exist, and for anyone who'd rather read
 *  a list than work a wheel. */
export function CategoryChips() {
  const prefix = useSkillsPrefix();
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {categories.map((cat) => (
        <li key={cat.id}>
          <Link
            href={`${prefix}/skills/${cat.id}`}
            className={`flex min-h-9 items-center gap-2 rounded-full border border-navy-600 px-3 py-1.5 text-xs transition-colors hover:border-current ${cat.textClass}`}
          >
            <CategoryIcon category={cat.id} className="size-4" />
            <span className="font-medium text-ink-muted">{cat.short}</span>
            <span className="tabular-nums text-ink-faint">
              {lessonsInCategory(cat.id).length}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
