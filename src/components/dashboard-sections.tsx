"use client";

import { useEffect, useState, type ReactNode } from "react";

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
// travelling between them. (A rail down the left side was tried first;
// it squeezed every panel into two-thirds of a phone.)
//
// The strip sticks under the header, so nothing has to be scrolled to
// reach it - including the profile card, which is a section here rather
// than a banner above.
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

export function DashboardPanel({ sections }: { sections: DashboardSection[] }) {
  const [openId, setOpenId] = useState(sections[0]?.id);
  // A section can come and go - "recent attempts" only exists once
  // there are some - so never hold a tab that isn't there any more.
  const open = sections.find((s) => s.id === openId) ?? sections[0];
  if (!open) return null;

  return (
    <div className="flex flex-col gap-3">
      <nav
        aria-label="Dashboard sections"
        className="sticky-under-header -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max gap-1 rounded-2xl border border-navy-600 bg-navy-800 p-1.5">
          {sections.map((section) => {
            const on = section.id === open.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={(e) => {
                  setOpenId(section.id);
                  e.currentTarget.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
                }}
                aria-current={on ? "true" : undefined}
                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors ${
                  on
                    ? `bg-navy-700 ${section.accentClass}`
                    : "text-ink-faint hover:bg-navy-850 hover:text-ink-muted"
                }`}
              >
                <section.Icon className="size-4" />
                {section.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* min-w-0 so a wide child - a chart, a table of attempts - scrolls
          inside the panel instead of widening the page. Every panel
          names itself in its own banner, so the strip doesn't say it
          again above them. */}
      <div className="flex min-w-0 flex-col">{open.content}</div>
    </div>
  );
}
