"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DeckIcon, SkillsIcon } from "@/components/icons";

// Skills and Cards are two ways through the same library - watch the
// lesson or hold the card - so they sit as two tabs of one section
// rather than as two places in the navigation. Which one you're on is
// the route, not component state, so a card section stays linkable and
// the back button behaves.
//
// The tabs ARE the section's heading: its symbol and its name, side
// by side, on clear ground. A separate title above them was the page
// introducing itself twice with the same word and the same symbol.

const tabs = [
  { href: "/skills", label: "Skills", Icon: SkillsIcon, accent: "text-storytelling" },
  { href: "/skills/cards", label: "Cards", Icon: DeckIcon, accent: "text-figurative" },
];

export function SectionTabs() {
  const pathname = usePathname();
  const prefix = pathname.startsWith("/demo") ? "/demo" : "";
  const onCards = pathname.includes("/skills/cards");

  return (
    <div role="tablist" aria-label="Skills and cards" className="flex w-full gap-2">
      {tabs.map(({ href, label, Icon, accent }) => {
        const active = href.includes("cards") ? onCards : !onCards;
        return (
          <Link
            key={href}
            href={`${prefix}${href}`}
            role="tab"
            aria-selected={active}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-2xl border py-3 transition-colors ${
              active
                ? `border-current bg-navy-800 ${accent}`
                : "border-navy-600 text-ink-faint hover:border-ink-faint hover:text-ink-muted"
            }`}
          >
            <Icon className="size-6 shrink-0" />
            <span className={`text-lg font-bold tracking-tight ${active ? "text-ink" : ""}`}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
