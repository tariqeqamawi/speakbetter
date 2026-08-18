"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Skills and Cards are two ways through the same library - watch the
// lesson or hold the card - so they sit as two tabs of one section
// rather than as two places in the navigation. Which one you're on is
// the route, not component state, so a card section stays linkable and
// the back button behaves.

const tabs = [
  { href: "/skills", label: "Skills" },
  { href: "/skills/cards", label: "Cards" },
];

export function SectionTabs() {
  const pathname = usePathname();
  const prefix = pathname.startsWith("/demo") ? "/demo" : "";
  const onCards = pathname.includes("/skills/cards");

  return (
    <div
      role="tablist"
      aria-label="Skills and cards"
      className="flex w-full gap-1 rounded-xl border border-navy-600 bg-navy-900/60 p-1"
    >
      {tabs.map((tab) => {
        const active = tab.href.includes("cards") ? onCards : !onCards;
        return (
          <Link
            key={tab.href}
            href={`${prefix}${tab.href}`}
            role="tab"
            aria-selected={active}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
              active
                ? "bg-navy-700 text-ink"
                : "text-ink-faint hover:text-ink-muted"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
