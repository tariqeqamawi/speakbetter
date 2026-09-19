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

export function DashboardPanel({
  sections,
  you,
}: {
  sections: DashboardSection[];
  /** The student's own card: a compact line above the strip, and the
   *  full card as the open panel when that line is tapped. */
  you: { compact: ReactNode; content: ReactNode };
}) {
  const [openId, setOpenId] = useState(sections[0]?.id);
  // A section can come and go - "recent attempts" only exists once
  // there are some - so never hold a tab that isn't there any more.
  const open = sections.find((s) => s.id === openId) ?? (openId === "you" ? undefined : sections[0]);
  const showingYou = openId === "you";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpenId("you")}
        aria-current={showingYou ? "true" : undefined}
        className={`rounded-2xl border text-left transition-colors ${
          showingYou ? "border-ink-faint bg-navy-800" : "border-navy-600 bg-navy-800 hover:border-ink-faint"
        }`}
      >
        {you.compact}
      </button>

      {/* Two rows of three, so every section is a tap away without a
          scroll - what a rail down the side and a strip along the top
          both failed at. */}
      <nav
        aria-label="Dashboard sections"
        className="sticky-under-header grid grid-cols-3 gap-1 rounded-2xl border border-navy-600 bg-navy-800 p-1.5"
      >
        {sections.map((section, i) => {
          const on = section.id === open?.id;
          // Seven sections in rows of three: the first - the coach -
          // takes a whole row, the six below sit two rows of three.
          const wide = sections.length % 3 === 1 && i === 0;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenId(section.id)}
              aria-current={on ? "true" : undefined}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[0.7rem] font-semibold transition-colors ${wide ? "col-span-3" : ""} ${
                on
                  ? `bg-navy-700 ${section.accentClass}`
                  : "text-ink-faint hover:bg-navy-850 hover:text-ink-muted"
              }`}
            >
              <section.Icon className="size-4 shrink-0" />
              <span className="truncate">{section.name}</span>
            </button>
          );
        })}
      </nav>

      {/* min-w-0 so a wide child - a chart, a table of attempts - scrolls
          inside the panel instead of widening the page. Every panel
          names itself in its own banner, so the strip doesn't say it
          again above them. */}
      <div className="flex min-w-0 flex-col">{showingYou ? you.content : open?.content}</div>
    </div>
  );
}
