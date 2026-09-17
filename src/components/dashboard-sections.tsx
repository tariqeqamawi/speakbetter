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
// So on a phone they nest: a rail down the left holding all of them, one
// panel open beside it. Tapping a section swaps what's open without
// moving the page, which is the difference between glancing at two
// things and travelling between them.
//
// The rail is the first thing on the page and it sticks under the
// header, so nothing has to be scrolled to reach it - including the
// profile card, which is a section here rather than a banner above,
// because a banner tall enough to be worth reading is also tall enough
// to push the rail off the screen.
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
    <div className="flex items-start gap-3">
      <nav
        aria-label="Dashboard sections"
        className="sticky-under-header flex shrink-0 flex-col gap-1 rounded-2xl border border-navy-600 bg-navy-800 p-1.5"
      >
        {sections.map((section) => {
          const on = section.id === open.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenId(section.id)}
              aria-current={on ? "true" : undefined}
              aria-label={section.name}
              title={section.name}
              className={`flex size-11 items-center justify-center rounded-xl transition-colors ${
                on
                  ? `bg-navy-700 ${section.accentClass}`
                  : "text-ink-faint hover:bg-navy-850 hover:text-ink-muted"
              }`}
            >
              <section.Icon className="size-5" />
            </button>
          );
        })}
      </nav>

      {/* min-w-0 so a wide child - a chart, a table of attempts - scrolls
          inside the panel instead of widening the page. Every panel
          names itself in its own banner, so the rail doesn't say it
          again above them. */}
      <div className="flex min-w-0 flex-1 flex-col">{open.content}</div>
    </div>
  );
}
