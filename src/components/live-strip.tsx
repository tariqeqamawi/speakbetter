"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nextPlanned, isPast } from "@/data/live-schedule";
import { CalendarIcon, ChevronDownIcon, LiveIcon } from "@/components/icons";

// The next live session, stuck under the header on the dashboard.
//
// WHY IT STICKS, WHEN NOTHING ELSE HERE DOES. Everything else on this
// page is a record of what somebody has already done - it will be
// there tomorrow, and the day after, unchanged. A live session is the
// only thing in this app that can be MISSED. It happens at an hour, on
// a date, whether or not anybody turned up, and a student who scrolled
// past it on Tuesday cannot have it back on Thursday.
//
// That asymmetry is the whole argument for the placement: a thing that
// expires earns a permanent position on the screen in a way that a
// thing that waits does not.
//
// It is one line. A sticky element is rent charged against every
// screenful below it, and the only fact it has to carry is when.

function when(iso: string, now: number): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

export function LiveStrip() {
  // The clock is read after mount, never during render.
  //
  // Two reasons, and the second is the one that bites. Reading it in
  // render is impure - the same props give a different answer a minute
  // later. And this component is server-rendered: the server's "in 9
  // days" and the browser's would be computed at different instants,
  // which is a hydration mismatch waiting for the one visitor who
  // loads the page as a countdown ticks over.
  // Null until mounted, then the clock. The first value comes from the
  // interval's own first tick rather than a synchronous set inside the
  // effect, which would be an extra render before the first paint.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.requestAnimationFrame(tick);
    // Re-read every minute, so "in 2 min" does not sit there lying
    // while somebody watches it.
    const t = setInterval(tick, 60_000);
    return () => {
      window.cancelAnimationFrame(id);
      clearInterval(t);
    };
  }, []);

  const session = nextPlanned();
  if (!session || now === null) return null;

  const past = isPast(session, new Date(now));
  const soon = !past && new Date(session.heldAt).getTime() - now < 60 * 60 * 1000;

  return (
    <Link
      href="/live"
      data-tour="live"
      className={`sticky-under-header -mx-1 flex min-h-11 items-center gap-2.5 rounded-full border px-4 transition-colors ${
        soon
          ? "border-acting bg-acting/15 text-acting hover:bg-acting/20"
          : "border-navy-600 bg-navy-800 text-ink-muted hover:border-ink-faint"
      }`}
    >
      {soon ? (
        <LiveIcon className="size-4 shrink-0 animate-pulse" />
      ) : (
        <CalendarIcon className="size-4 shrink-0 text-figurative" />
      )}

      <span className="min-w-0 flex-1 truncate text-xs">
        <span className="font-bold text-ink">Live session</span>
        <span className="pl-2">
          {past ? "watch it back" : `${session.title} · ${when(session.heldAt, now)}`}
        </span>
      </span>

      <ChevronDownIcon className="size-4 shrink-0 -rotate-90 opacity-60" />
    </Link>
  );
}
