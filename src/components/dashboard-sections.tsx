"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

// The dashboard on a phone.
//
// The dashboard is panels of real work - who you are, the challenges,
// the lessons, the spectrum signature, the streak, the badges, the
// recent attempts - and on a laptop they sit two to a row and read as
// one heads-up display. On a phone the same panels stack into a column
// five screens tall, so checking the streak against the badge you're
// closest to means scrolling past everything in between and back.
//
// So on a phone they tab: a strip of the sections along the top, under
// the header's soundwave, and one panel open below it at the full width
// of the screen. Tapping a section swaps what's open without moving the
// page, which is the difference between glancing at two things and
// traveling between them. (A rail down the left side was tried first;
// it squeezed every panel into two-thirds of a phone.)
//
// The strip is the first thing on the page and sticks under the header,
// with the live session under it and the profile card under that.
//
// The desktop layout is untouched - it never had the problem.

export interface DashboardSection {
  id: string;
  /** Named in the rail's tooltip and over the open panel. */
  name: string;
  Icon: (props: { className?: string }) => ReactNode;
  /** The section's own color, so the rail reads as the app does. */
  accentClass: string;
  content: ReactNode;
}

/**
 * True on a phone-width screen.
 *
 * Rendered rather than CSS-hidden because the two layouts hold the same
 * panels: hiding one with `md:hidden` would build both, and the
 * dashboard's panels are charts, calendars and forty-four badges.
 */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return phone;
}

export function DashboardPanel({
  sections,
  you,
  live,
}: {
  sections: DashboardSection[];
  /** The student's own card: a compact line under the strip, and the
   *  full card as the open panel when that line is tapped. */
  you: { compact: (open: boolean, toggle: () => void) => ReactNode; content: ReactNode };
  /** The live-session strip, which sits right under the sections bar. */
  live?: ReactNode;
}) {
  // A link can name the tab to open - the header's menu does, and the
  // landing page's phone frames show the trophy case this way. It is
  // followed whenever it changes, not only on arrival, so the menu works
  // from the dashboard itself.
  const asked = useSearchParams().get("tab");
  const [openId, setOpenId] = useState(sections.some((s) => s.id === asked) ? asked! : sections[0]?.id);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow the address
    if (asked && sections.some((s) => s.id === asked)) setOpenId(asked);
  }, [asked, sections]);
  // A section can come and go - "recent attempts" only exists once
  // there are some - so never hold a tab that isn't there any more.
  const open = sections.find((s) => s.id === openId) ?? sections[0];
  // The card opens in place rather than taking the panel's turn: who
  // you are and what you are looking at are two different questions,
  // and answering one should not close the other.
  const [youOpen, setYouOpen] = useState(false);

  // The strip scrolls sideways; glowing arrows at either end say so, and
  // each goes once there is nothing more that way.
  const strip = useRef<HTMLElement>(null);
  const [more, setMore] = useState({ left: false, right: true });
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const sync = () =>
      setMore({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  const nudge = (dir: 1 | -1) => strip.current?.scrollBy({ left: dir * 160, behavior: "smooth" });

  return (
    // Pulled up to sit straight under the header: the bar is the first
    // thing on the page, with no dead space above it.
    <div className="-mt-3 flex flex-col gap-4 lg:-mt-8">
      {/* One bar, the same shape as every other "switch the view of
          this page" control in the app - full width, scrolling sideways
          rather than wrapping into rows, stuck under the header. */}
      <div className="sticky-under-header relative -mx-4 border-b border-navy-600 bg-navy-900/95 backdrop-blur">
        <nav
          ref={strip}
          aria-label="Dashboard sections"
          className="flex gap-1 overflow-x-auto px-9 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section) => {
            const on = section.id === open?.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setOpenId(section.id)}
                aria-current={on ? "true" : undefined}
                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[0.75rem] font-semibold transition-colors ${
                  on ? `bg-navy-700 ${section.accentClass}` : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                <section.Icon className="size-4 shrink-0" />
                {section.name}
              </button>
            );
          })}
        </nav>
        {(["left", "right"] as const).map((side) => (
          <button
            key={side}
            type="button"
            aria-label={side === "left" ? "More sections to the left" : "More sections to the right"}
            onClick={() => nudge(side === "left" ? -1 : 1)}
            className={`strip-arrow absolute inset-y-0 ${side === "left" ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l"} flex w-9 items-center justify-center from-navy-900 via-navy-900/90 to-transparent transition-opacity ${
              more[side] ? "opacity-100" : "pointer-events-none opacity-25"
            }`}
          >
            <span aria-hidden className="text-lg font-bold leading-none">
              {side === "left" ? "‹" : "›"}
            </span>
          </button>
        ))}
      </div>

      {live}

      {/* The student's own card, folded to a line; tap to open it. */}
      <div className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
        {you.compact(youOpen, () => setYouOpen((o) => !o))}
      </div>

      {/* min-w-0 so a wide child - a chart, a table of attempts - scrolls
          inside the panel instead of widening the page. Every panel
          names itself in its own banner, so the strip doesn't say it
          again above them. */}
      <div className="flex min-w-0 flex-col">{open?.content}</div>
    </div>
  );
}
