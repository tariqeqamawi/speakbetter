"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DeckIcon, SkillsIcon } from "@/components/icons";
import { SkillsViewToggle } from "@/components/skills-browser";

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

/** `info`: the section's eye (info-eye.tsx), beside the tabs. */
export function SectionTabs({ info }: { info?: ReactNode } = {}) {
  const pathname = usePathname();
  const prefix = pathname.startsWith("/demo") ? "/demo" : "";
  const onCards = pathname.includes("/skills/cards");

  // A slim row tucked right under the top bar: on Skills, the Dial / Grid
  // switch first, then the two tabs as small pills - a setting and a
  // choice of section, not a pair of headline buttons.
  return (
    <div className="-mt-2 flex items-center gap-1.5 lg:-mt-6">
      {!onCards && <SkillsViewToggle />}
      <div role="tablist" aria-label="Skills and cards" className="flex gap-1.5">
        {tabs.map(({ href, label, Icon, accent }) => {
          const active = href.includes("cards") ? onCards : !onCards;
          return (
            <Link
              key={href}
              href={`${prefix}${href}`}
              role="tab"
              aria-selected={active}
              className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? `border-current bg-navy-800 ${accent}`
                  : "border-navy-600 text-ink-faint hover:border-ink-faint hover:text-ink-muted"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className={active ? "text-ink" : ""}>{label}</span>
            </Link>
          );
        })}
      </div>
      {info}
      {/* On Cards, the deck's two other ways in, in one small pill on the
          right: Full spread (a card of every colour - the little fan says
          so), and, in the same pill, the shuffle - its arrows forever
          swapping direction and colour, so it reads as "a different card".
          They tell the deck by an event (card-deck.tsx). */}
      {onCards && (
        <div className="ml-auto flex min-h-9 items-stretch overflow-hidden rounded-full border border-navy-600">
          <button
            type="button"
            data-tour="spread"
            onClick={() => window.dispatchEvent(new Event("sb-deck-deal"))}
            className="flex items-center gap-1.5 whitespace-nowrap py-1.5 pl-2.5 pr-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-navy-800 hover:text-ink"
          >
            <MiniFan />
            {/* (Shorter on a narrow phone, so the shuffle stays on screen.) */}
            <span className="min-[400px]:hidden">Spread</span>
            <span className="hidden min-[400px]:inline">Full spread</span>
          </button>
          <span aria-hidden className="my-1.5 w-px bg-navy-600" />
          <button
            type="button"
            data-tour="shuffle"
            aria-label="A random card"
            title="A random card"
            onClick={() => window.dispatchEvent(new Event("sb-deck-random"))}
            className="flex items-center px-2 transition-colors hover:bg-navy-800"
          >
            <ShuffleFlip />
          </button>
        </div>
      )}
    </div>
  );
}

/** A hand of cards in miniature: five tiny cards fanned, each in a
 *  colour of the spectrum - "one of every colour" at a glance. */
function MiniFan() {
  const cols = ["storytelling", "figurative", "acting", "structure", "body-language"];
  return (
    <svg viewBox="0 0 22 16" className="h-4 w-[1.35rem] shrink-0" aria-hidden>
      {cols.map((c, i) => (
        <rect
          key={c}
          x={8.5}
          y={2}
          width={5}
          height={8}
          rx={1}
          fill={`var(--color-${c})`}
          stroke="var(--color-navy-900)"
          strokeWidth={0.6}
          transform={`rotate(${(i - 2) * 16} 11 15)`}
        />
      ))}
    </svg>
  );
}

/** The shuffle: two arrows passing each other - the top one going right,
 *  the bottom one left - that every so often swap over, turning through
 *  the spectrum as they do (.shuffle-flip in globals.css). */
function ShuffleFlip() {
  return (
    <svg viewBox="0 0 24 24" className="shuffle-flip size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h14M14 4l4 4-4 4" />
      <path d="M20 16H6M10 12l-4 4 4 4" />
    </svg>
  );
}
