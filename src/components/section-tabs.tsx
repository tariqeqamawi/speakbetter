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
// The tabs are the section's own two symbols, large, on clear ground.
// The page's heading says "Skills" or "Cards" directly above them, so
// a pair of pills repeating those two words was the same information
// twice - and two symbols side by side are read faster than two words
// anyway. The words survive for anybody who cannot see them, as the
// accessible name.

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
            aria-label={label}
            title={label}
            className={`flex flex-1 items-center justify-center rounded-2xl border py-3 transition-colors ${
              active
                ? `border-current bg-navy-800 ${accent}`
                : "border-navy-600 text-ink-faint hover:border-ink-faint hover:text-ink-muted"
            }`}
          >
            <Icon className="size-7" />
          </Link>
        );
      })}
    </div>
  );
}
