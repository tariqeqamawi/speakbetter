"use client";

import { useEffect, useState, type ReactNode } from "react";
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

export function DashboardPanel({
  sections,
  you,
}: {
  sections: DashboardSection[];
  /** The student's own card: a compact line above the strip, and the
   *  full card as the open panel when that line is tapped. */
  you: { compact: (open: boolean, toggle: () => void) => ReactNode; content: ReactNode };
}) {
  // A link can name the tab to open - the landing page's phone frames
  // show the trophy case this way.
  const asked = useSearchParams().get("tab");
  const [openId, setOpenId] = useState(sections.some((s) => s.id === asked) ? asked! : sections[0]?.id);
  // A section can come and go - "recent attempts" only exists once
  // there are some - so never hold a tab that isn't there any more.
  const open = sections.find((s) => s.id === openId) ?? sections[0];
  // The card opens in place rather than taking the panel's turn: who
  // you are and what you are looking at are two different questions,
  // and answering one should not close the other.
  const [youOpen, setYouOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
        {you.compact(youOpen, () => setYouOpen((o) => !o))}
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: youOpen ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-navy-600">{you.content}</div>
          </div>
        </div>
      </div>

      {/* One bar, the same shape as every other "switch the view of
          this page" control in the app - under the title, full width,
          scrolling sideways rather than wrapping into rows. A student
          should learn one place to look. */}
      <nav
        aria-label="Dashboard sections"
        className="sticky-under-header -mx-4 flex gap-1 overflow-x-auto rounded-none border-y border-navy-600 bg-navy-900/95 px-4 py-1.5 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-navy-900/60 sm:px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

      {/* min-w-0 so a wide child - a chart, a table of attempts - scrolls
          inside the panel instead of widening the page. Every panel
          names itself in its own banner, so the strip doesn't say it
          again above them. */}
      <div className="flex min-w-0 flex-col">{open?.content}</div>
    </div>
  );
}
