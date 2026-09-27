"use client";

import { useEffect, useState } from "react";

// The landing page, as chapters. Each chapter starts with a mark - a
// numbered label between two rules, so the page reads as sections
// rather than one long scroll - and a navigator holds them all: dots
// down the right edge on a laptop (the name on hover, and always on a
// screen wide enough to spare the room), a "Sections" button on a phone.

export const LANDING_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "coach", label: "Meet Coach" },
  { id: "different", label: "Why it's different" },
  { id: "app", label: "Inside the app" },
  { id: "spectrum", label: "Speaking Spectrum" },
  { id: "lessons", label: "The lessons" },
  { id: "challenges", label: "The challenges" },
  { id: "mentors", label: "Two mentors" },
  { id: "pricing", label: "Pricing" },
] as const;

type SectionId = (typeof LANDING_SECTIONS)[number]["id"];

/** The start of a chapter. The first one is only an anchor - the hero
 *  needs no label over it. */
export function SectionMark({ id }: { id: SectionId }) {
  const i = LANDING_SECTIONS.findIndex((s) => s.id === id);
  const s = LANDING_SECTIONS[i];
  if (i === 0) return <div id={s.id} data-landing-section className="scroll-mt-24" />;
  return (
    <div id={s.id} data-landing-section className="flex scroll-mt-24 items-center gap-4 pt-4" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-600" />
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-faint">
        <span className="tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span> · {s.label}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-600" />
    </div>
  );
}

function useActive(): SectionId {
  const [active, setActive] = useState<SectionId>("overview");
  useEffect(() => {
    const marks = () => Array.from(document.querySelectorAll<HTMLElement>("[data-landing-section]"));
    const onScroll = () => {
      // The chapter whose mark was last passed, a third of the way down.
      const line = window.innerHeight / 3;
      let current: SectionId = "overview";
      for (const m of marks()) if (m.getBoundingClientRect().top <= line) current = m.id as SectionId;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return active;
}

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function SectionNav() {
  const active = useActive();
  const [open, setOpen] = useState(false);
  const current = LANDING_SECTIONS.find((s) => s.id === active)!;

  return (
    <>
      {/* Laptop: dots down the right edge. */}
      <nav
        aria-label="Page sections"
        className="group/nav fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 lg:flex"
      >
        {LANDING_SECTIONS.map((s, i) => {
          const on = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={on ? "true" : undefined}
              className="group/item flex items-center justify-end gap-2.5 py-1"
            >
              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold transition-all 2xl:bg-transparent 2xl:opacity-100 2xl:shadow-none ${
                  on ? "text-ink" : "text-ink-muted"
                } pointer-events-none bg-navy-900/95 opacity-0 shadow-lg shadow-navy-950 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100`}
              >
                <span className="mr-1 tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                {s.label}
              </span>
              <span
                className={`shrink-0 rounded-full transition-all ${
                  on ? "h-6 w-2 bg-figurative" : "size-2 bg-navy-600 group-hover/item:bg-ink-faint"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Phone and tablet: one button, the list on a tap. */}
      <div className="fixed right-3 top-[4.6rem] z-30 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border border-navy-600 bg-navy-900/95 px-3 py-1.5 text-xs font-semibold text-ink-muted shadow-lg shadow-navy-950"
        >
          <span className="size-1.5 rounded-full bg-figurative" />
          {current.label}
          <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {open && (
          <ul className="mt-2 flex w-52 flex-col rounded-2xl border border-navy-600 bg-navy-900/98 p-1.5 shadow-2xl shadow-navy-950">
            {LANDING_SECTIONS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    go(s.id);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                    s.id === active ? "bg-navy-700 text-ink" : "text-ink-muted"
                  }`}
                >
                  <span className="w-5 text-xs tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
