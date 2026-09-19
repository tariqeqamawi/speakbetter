"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { ChallengesIcon, CommunityIcon, ProfileIcon, SkillsIcon, ListenIcon } from "@/components/icons";
import { Soundwave } from "@/components/soundwave";
import { LionMouth } from "@/components/lion-mouth";
import { LevelIcon, levelMeta } from "@/components/level-icon";

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
            <LevelBadge />
          </div>
        </div>
      </div>
    </header>
  );
}

/** The coach, one tap away wherever the student is: the lion's head
 *  in the header, lit when they're on the coach's page. */
function CoachButton() {
  const { state, ready } = useStore();
  const pathname = usePathname();
  if (!ready || !state.unlocked) return null;
  const on = pathname.startsWith("/coach");
  return (
    <Link
      href="/coach"
      title="Your coach - ask a question, read back your reviews"
      aria-label="Your coach"
      className={`relative flex size-11 items-center justify-center rounded-full border transition-colors ${
        on ? "border-advanced shadow-[0_0_16px_-4px_var(--color-advanced)]" : "border-navy-600 hover:border-ink-faint"
      }`}
    >
      <span className="w-9 overflow-hidden">
        <LionMouth level={0} className="w-full translate-y-0.5" />
      </span>
      <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full border border-navy-900 bg-advanced text-navy-950">
        <ListenIcon className="size-2.5" />
      </span>
    </Link>
  );
}

/** The student's level lion, following them across the app. */
function LevelBadge() {
  const { state, ready } = useStore();
  if (!ready || !state.unlocked || !state.level) return null;
  const meta = levelMeta[state.level];
  return (
    <Link
      href="/profile"
      title={`${meta.label} - change your level`}
      className="flex min-h-11 items-center gap-1.5 rounded-full border border-navy-600 px-2.5 py-1 transition-colors hover:border-ink-faint"
    >
      <LevelIcon level={state.level} className="h-6 w-auto" />
      <span className="hidden text-[0.7rem] font-semibold text-ink-muted sm:inline">
        {meta.label}
      </span>
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
