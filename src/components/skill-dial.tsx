"use client";

import Image from "next/image";
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
const ARC_GAP = 10; // degrees left unlit between arcs

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
  const activeLessons = active ? lessonsInCategory(active.id) : [];
  const activeWatched = activeLessons.filter((l) =>
    state.watchedLessons.includes(l.vimeoId),
  ).length;
  const totalLessons = categories.reduce(
    (sum, c) => sum + lessonsInCategory(c.id).length,
    0,
  );

  return (
    <div
      ref={dialRef}
      className="relative mx-auto aspect-square w-full max-w-xl select-none touch-pan-y"
    >
      {/* The ring: one arc per category, faint until its node is hovered.
          Decorative - the nodes carry the interaction. */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {categories.map((cat, i) => {
          const start = i * NODE_ANGLE + ARC_GAP / 2;
          const end = (i + 1) * NODE_ANGLE - ARC_GAP / 2;
          const lit = hovered === cat.id;
          return (
            <path
              key={cat.id}
              d={arcPath(start, end, ARC_R)}
              fill="none"
              stroke={`var(--color-${cat.id})`}
              strokeWidth={lit ? 2.2 : 1}
              strokeLinecap="round"
              opacity={lit ? 0.95 : hovered ? 0.15 : 0.3}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* The hub: names whatever the pointer is on. */}
      <div
        className={`absolute left-1/2 top-1/2 flex aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full border bg-navy-800/90 p-6 text-center transition-colors duration-300 ${
          active ? `border-current ${active.textClass}` : "border-navy-600"
        }`}
      >
        {/* The lion holds the center whatever the pointer does - it's
            the brand's hub, not a slot the categories take turns in.
            The words beneath it are what change. */}
        <Image
          src="/logo-mark.png"
          alt=""
          width={320}
          height={256}
          className="h-20 w-auto sm:h-28"
        />
        {active ? (
          <>
            <span
              className={`text-base font-semibold leading-tight sm:text-lg ${active.textClass}`}
            >
              {active.name}
            </span>
            <span className="text-xs text-ink-muted">
              {activeLessons.length} lessons
              {activeWatched > 0 && ` · ${activeWatched} watched`}
            </span>
            <span className="text-[0.65rem] uppercase tracking-wider text-ink-faint">
              Click to open
            </span>
          </>
        ) : (
          <>
            <span className="text-base font-semibold text-ink sm:text-lg">
              Seven colors
            </span>
            <span className="text-xs text-ink-muted">
              {totalLessons} lessons · pick where to dip in
            </span>
          </>
        )}
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
            <span className="font-medium text-ink-muted">{cat.name}</span>
            <span className="tabular-nums text-ink-faint">
              {lessonsInCategory(cat.id).length}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
