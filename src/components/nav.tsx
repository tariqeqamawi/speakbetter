"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { ChallengesIcon, CommunityIcon, ProfileIcon, SkillsIcon } from "@/components/icons";
import { Soundwave } from "@/components/soundwave";
import { LionMouth } from "@/components/lion-mouth";

const destinations = [
  { href: "/community", label: "Community", Icon: CommunityIcon },
  { href: "/challenges", label: "Challenges", Icon: ChallengesIcon },
  { href: "/skills", label: "Skills", Icon: SkillsIcon },
  // The route stays /profile so existing links keep working; the name a
  // student sees is Dashboard, which is what the page became.
  { href: "/profile", label: "Dashboard", Icon: ProfileIcon },
] as const;

export function TopBar() {
  return (
    <header className="pt-safe sticky top-0 z-20 bg-navy-900/92">
      <div className="spectrum-rule h-0.5" />
      {/* The soundwave lives in the band between the two rules */}
      <div className="relative border-b border-navy-700/80">
        <Soundwave variant="header" className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="-mx-2 flex min-h-11 items-center gap-2.5 px-2">
            <Image
              src="/logo-mark.png"
              alt=""
              width={320}
              height={256}
              priority
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold tracking-tight">
              Speak Better
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <DesktopLinks />
            <CoachButton />
          </div>
        </div>
      </div>
    </header>
  );
}

/** The coach, one tap away wherever the student is: the lion's head
 *  in a pill, named, lit when they're on the coach's page. The level
 *  is changed on the dashboard, so the header carries one lion. */
function CoachButton() {
  const { state, ready } = useStore();
  const pathname = usePathname();
  if (!ready || !state.unlocked) return null;
  const on = pathname.startsWith("/coach");
  return (
    <Link
      href="/coach"
      title="Your AI coach - ask a question, read back your reviews"
      className={`coach-pill flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 hover:scale-[1.03] active:scale-[0.98] ${
        on ? "ring-2 ring-ink/70" : ""
      }`}
    >
      <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-navy-950/25">
        <LionMouth level={0} className="w-10 translate-y-0.5" />
      </span>
      <span className="text-xs font-bold tracking-wide text-navy-950">AI Coach</span>
    </Link>
  );
}

function DesktopLinks() {
  const pathname = usePathname();
  const { state, ready } = useStore();
  if (!ready || !state.unlocked) return null;
  return (
    <nav className="hidden gap-1 sm:flex" aria-label="Primary">
      {destinations.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-navy-800 text-ink"
                : "text-ink-faint hover:text-ink-muted"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  const { state, ready } = useStore();
  if (!ready || !state.unlocked) return null;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-600 bg-navy-850/97 sm:hidden"
      aria-label="Primary"
    >
      <div className="pb-safe mx-auto flex max-w-md items-stretch justify-around">
        {destinations.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors ${
                active ? "text-ink" : "text-ink-faint"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
