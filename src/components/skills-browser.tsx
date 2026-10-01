"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { categories, type Category } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { SkillDial } from "@/components/skill-dial";
import { VideoStill } from "@/components/video-still";
import { CategoryIcon } from "@/components/category-icons";
import { DeckIcon } from "@/components/icons";
import { useStore } from "@/lib/store";
import { setSkillsView, useSkillsView, type SkillsView } from "@/lib/skills-view";

// Skills, two ways: the dial, or the grid. A switch at the top flips
// between them and stays where it is left (skills-view.ts).

/** Each colour's face in the grid: a lesson that shows what the colour
 *  is about, rather than simply its first. Any id not found falls back
 *  to the colour's first lesson. */
const FACE: Partial<Record<Category["id"], string>> = {
  storytelling: "1081031902",
  figurative: "1081032328",
  acting: "1081162875",
  voice: "1081162033",
  structure: "1080648113",
  mindset: "1081029780",
  "body-language": "1080653314",
  advanced: "1081161658",
};

function faceOf(cat: Category): string {
  const lessons = lessonsInCategory(cat.id);
  const wanted = FACE[cat.id];
  return (wanted && lessons.find((l) => l.vimeoId === wanted)?.vimeoId) || lessons[0].vimeoId;
}

export function SkillsBrowser({ children }: { children?: ReactNode }) {
  const view = useSkillsView();
  return (
    <div className="flex flex-col gap-3">
      {/* The section's note. (The Dial / Grid switch lives in the row
          of section tabs under the top bar - section-tabs.tsx.) */}
      {children}
      {view === "grid" ? <SkillGrid /> : <SkillDial />}
    </div>
  );
}

/** The Dial / Grid switch on its own, for the section tabs' row: a fixed
 *  small footprint that opens over the page, so opening it never shifts
 *  the layout. */
export function SkillsViewToggle() {
  const view = useSkillsView();
  return (
    <div className="relative z-30 h-5 w-9 shrink-0">
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <ViewSwitch view={view} />
      </div>
    </div>
  );
}

/** The switch, kept tiny: a pill with a dot in it, the dot on the left
 *  for the dial and on the right for the grid. Point at it (or tap it,
 *  or tab to it) and it grows into "Dial | Grid"; choose one and the
 *  highlight slides across, then it shrinks back to the small pill with
 *  the dot on its new side. */
function ViewSwitch({ view }: { view: SkillsView }) {
  const [open, setOpen] = useState(false);
  // After a choice it closes even under the pointer; it waits for the
  // pointer to leave before hovering can open it again.
  const settled = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grid = view === "grid";

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // A tap elsewhere closes it on a touch screen.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const choose = (next: SkillsView) => {
    setSkillsView(next);
    settled.current = true;
    // Long enough to see the highlight slide across, then back to small.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 380);
  };

  const options: { id: SkillsView; label: string }[] = [
    { id: "dial", label: "Dial" },
    { id: "grid", label: "Grid" },
  ];

  return (
    <div
      ref={root}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" && !settled.current) setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        settled.current = false;
        setOpen(false);
      }}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div
        role="radiogroup"
        aria-label="Show skills as"
        className={`relative flex items-center overflow-hidden rounded-full border bg-navy-900/90 shadow-lg backdrop-blur transition-all duration-300 ease-out ${
          open ? "h-9 w-36 border-navy-500 p-1 shadow-navy-950/60" : "h-5 w-9 border-navy-600 p-0.5 shadow-transparent"
        }`}
      >
        {/* The dot when small; the highlight under the chosen word when open. */}
        <span
          aria-hidden
          className={`absolute rounded-full transition-all duration-300 ease-out ${
            open
              ? `top-1 bottom-1 w-[calc(50%-0.25rem)] border border-body-language/60 bg-body-language/15 ${grid ? "left-1/2" : "left-1"}`
              : `top-1/2 size-3 -translate-y-1/2 bg-body-language shadow-[0_0_8px_var(--color-body-language)] ${grid ? "left-[calc(100%-1rem)]" : "left-1"}`
          }`}
        />
        {options.map((o) => {
          const on = view === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={open ? (on ? 0 : -1) : -1}
              onClick={() => choose(o.id)}
              className={`relative z-10 flex h-full flex-1 items-center justify-center rounded-full text-sm font-semibold transition-opacity duration-200 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              } ${on ? "text-body-language" : "text-body-language/70 hover:text-body-language"}`}
            >
              {o.label}
            </button>
          );
        })}
        {/* Small, the whole pill is one button: tap (or Enter) opens it. */}
        {!open && (
          <button
            type="button"
            aria-label={`Show skills as: ${grid ? "Grid" : "Dial"}. Change`}
            onClick={() => {
              settled.current = false;
              setOpen(true);
            }}
            className="absolute inset-0 z-20 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-body-language"
          />
        )}
      </div>
    </div>
  );
}

/** The eight colours, one under another: a lesson from each as its
 *  face, its name, and how many of its lessons you have watched. */
function SkillGrid() {
  const prefix = usePathname().startsWith("/demo") ? "/demo" : "";
  const { state, ready } = useStore();
  return (
    <ul className="flex flex-col gap-3">
      {categories.map((cat, i) => {
        const lessons = lessonsInCategory(cat.id);
        const watched = ready ? lessons.filter((l) => state.watchedLessons.includes(l.vimeoId)).length : 0;
        return (
          <li key={cat.id} className="challenge-enter flex items-stretch gap-2" style={{ animationDelay: `${i * 40}ms` }}>
            <Link
              href={`${prefix}/skills/${cat.id}`}
              className={`lift-card group flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-xl border border-navy-600 bg-navy-900/60 pr-3 transition-colors hover:border-current ${cat.textClass}`}
            >
              <span className={`w-1 self-stretch ${cat.bgClass}`} />
              <span className="relative my-2 block aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 sm:w-40">
                <VideoStill vimeoId={faceOf(cat)} accent={cat} sizes="160px" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-2">
                <span className="flex items-center gap-1.5">
                  <CategoryIcon category={cat.id} className="size-4" />
                  <span className="text-base font-semibold text-ink">{cat.name}</span>
                </span>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">{cat.subtitle}</span>
                <span className="text-xs tabular-nums text-ink-muted">
                  {lessons.length} lessons{watched > 0 ? ` · ${watched} watched` : ""}
                </span>
              </span>
            </Link>
            {/* The same colour's flash cards, one tap away. */}
            <Link
              href={`${prefix}/skills/cards?color=${cat.id}`}
              aria-label={`${cat.name} flash cards`}
              className={`lift-card flex w-16 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-navy-600 bg-navy-900/60 px-1 text-center transition-colors hover:border-current sm:w-20 ${cat.textClass}`}
            >
              <DeckIcon className="size-5" />
              <span className="text-[0.6rem] font-semibold uppercase leading-tight tracking-wider text-ink-muted sm:text-[0.65rem]">
                Flash cards
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
