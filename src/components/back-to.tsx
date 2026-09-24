"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons";

// The way back, to where you actually came from.
//
// Community is reachable from two places - the bar on Today and the
// Community panel on the dashboard - and the back link said "Back to
// Today" either way. For half the people using it that was a lie about
// their own history: they pressed it expecting the dashboard and landed
// somewhere else, which is worse than no back link at all.
//
// The origin travels as ?from= on the link rather than being read from
// the referrer or from history. Referrers are missing or wrong often
// enough (a bookmark, a shared link, a PWA cold start) that a label
// built on one is a label that is sometimes false, and history.back()
// cannot be labelled at all - you cannot name a door you have not
// looked through.
//
// An unknown or absent origin falls back to Today, which is the app's
// home and the honest default for somebody who arrived from nowhere.

const ORIGINS: Record<string, { href: string; label: string }> = {
  dash: { href: "/profile", label: "Back to Dash" },
  today: { href: "/", label: "Back to Today" },
  challenges: { href: "/challenges", label: "Back to Challenges" },
};

export function BackTo({ fallback = "today" }: { fallback?: keyof typeof ORIGINS }) {
  const from = useSearchParams().get("from");
  const origin = (from && ORIGINS[from]) || ORIGINS[fallback];
  return (
    <Link
      href={origin.href}
      className="-mb-1 flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-faint transition-colors hover:text-ink"
    >
      <ChevronDownIcon className="size-4 rotate-90" />
      {origin.label}
    </Link>
  );
}
