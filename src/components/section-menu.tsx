"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useIsPhone } from "@/components/dashboard-sections";
import { ChallengesIcon, FlameIcon, GroupIcon, MedalIcon, SkillsIcon, SpectrumIcon } from "@/components/icons";

// The menu in the top right: the dashboard's sections, from anywhere.
// On a phone each opens that tab of the dashboard; on a laptop, where
// the dashboard shows every panel at once, it scrolls to the panel - and
// Community, which the laptop dashboard has no panel for, opens its page.

const ITEMS = [
  { tab: "challenges", label: "Challenges", Icon: ChallengesIcon, accent: "text-structure" },
  { tab: "lessons", label: "Skills", Icon: SkillsIcon, accent: "text-storytelling" },
  { tab: "signature", label: "Spectrum", Icon: SpectrumIcon, accent: "text-body-language" },
  { tab: "streak", label: "Streak", Icon: FlameIcon, accent: "text-acting" },
  { tab: "badges", label: "Trophies", Icon: MedalIcon, accent: "text-mindset" },
  { tab: "community", label: "Community", Icon: GroupIcon, accent: "text-mindset" },
] as const;

export function SectionMenu() {
  const { state, ready } = useStore();
  const phone = useIsPhone();
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Closes on a tap anywhere else, and whenever the page changes.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new page closes the menu
    setOpen(false);
  }, [pathname, tab]);

  if (!ready || !state.unlocked) return null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Menu"
        className="flex size-10 items-center justify-center rounded-full border border-navy-600/80 text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
          <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
        </svg>
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-50 mt-2 flex w-56 flex-col rounded-2xl border border-navy-600 bg-navy-900/98 p-1.5 shadow-2xl shadow-navy-950 backdrop-blur">
          {ITEMS.map(({ tab: id, label, Icon, accent }) => (
            <li key={id}>
              <Link
                href={!phone && id === "community" ? "/community" : `/profile?tab=${id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-navy-800 hover:text-ink"
              >
                <Icon className={`size-4.5 shrink-0 ${accent}`} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** On a laptop's dashboard, where every panel shows at once: scroll to
 *  the one the menu asked for (?tab=…). */
const ANCHOR: Record<string, string> = {
  challenges: "dash-challenges",
  lessons: "dash-lessons",
  signature: "dash-signature",
  streak: "dash-streak",
  badges: "trophy-case",
};

export function ScrollToPanel() {
  const tab = useSearchParams().get("tab");
  useEffect(() => {
    const id = tab ? ANCHOR[tab] : undefined;
    if (!id) return;
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => window.clearTimeout(t);
  }, [tab]);
  return null;
}
