"use client";

import Link from "next/link";
import { ChevronDownIcon, GroupIcon } from "@/components/icons";

// The community, as a bar that stays put.
//
// It was a full card in the flow of Today, which meant it was a thing
// you scrolled past once and then never saw again for the rest of the
// session. The question it answers - "is anyone else actually doing
// this?" - is not a question somebody asks once on the way down the
// page; it is the one they ask at the exact moment a challenge looks
// hard, which is whenever they happen to be looking at it.
//
// So it sticks under the header: one line, always there, always a door.
// Slim on purpose - a sticky element is rent charged against every
// screen below it, and a fat one would push the day's actual work off
// the fold.

export function TodayCommunityBar() {
  return (
    <Link
      href="/community"
      data-tour="community"
      // A pill, in the community's own colour, saying one word.
      //
      // It carried a headcount before - "31 others are on this
      // challenge" - which is the more interesting sentence and the
      // wrong one for a bar somebody is scanning past. A door is
      // labelled with where it goes; what is behind it is what you
      // find when you open it, and everything about who is there is
      // already on the page this opens.
      className="sticky-under-header -mx-1 flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-mindset px-5 text-navy-950 shadow-[0_0_28px_-8px_var(--color-mindset)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
    >
      <GroupIcon className="size-5 shrink-0" />
      <span className="text-base font-bold tracking-tight">Community</span>
      <ChevronDownIcon className="size-4 shrink-0 -rotate-90 opacity-70" />
    </Link>
  );
}
