"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { presence } from "@/data/community-presence";
import { ChevronDownIcon, GroupIcon } from "@/components/icons";
import { Avatar } from "@/components/avatar";

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
  const { ready, isChallengeComplete } = useStore();
  const crowd = useMemo(() => presence(), []);
  if (!ready) return null;

  // The challenge they are on, and who else is standing on it.
  const mine =
    challenges.find((c) => !c.passive && !isChallengeComplete(c.slug)) ??
    challenges.filter((c) => !c.passive).at(-1)!;
  const here = crowd.find((c) => c.slug === mine.slug);
  // `recent` is who has been seen on it lately - the right few faces
  // to show, rather than every name on the challenge.
  const faces = (here?.recent ?? []).slice(0, 3).map((r) => r.name);
  const others = here?.count ?? 0;

  return (
    <Link
      href="/community"
      data-tour="community"
      className="sticky-under-header -mx-1 flex items-center gap-3 rounded-full border border-mindset/40 bg-navy-800 px-3 py-2 transition-colors hover:border-mindset"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mindset/15 text-mindset">
        <GroupIcon className="size-4" />
      </span>

      {faces.length > 0 && (
        <span className="flex shrink-0 -space-x-2">
          {faces.map((name: string) => (
            <Avatar key={name} name={name} className="size-6 ring-2 ring-navy-800" />
          ))}
        </span>
      )}

      <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-muted">
        {others > 0 ? (
          <>
            <span className="font-bold text-ink">{others}</span> others are on this challenge right now
          </>
        ) : (
          "See everyone's progress alongside yours"
        )}
      </span>

      <ChevronDownIcon className="size-4 shrink-0 -rotate-90 text-ink-faint" />
    </Link>
  );
}
