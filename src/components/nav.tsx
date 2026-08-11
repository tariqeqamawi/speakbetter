"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  ChallengesIcon,
  CommunityIcon,
  ProfileIcon,
  SkillsIcon,
} from "@/components/icons";
import { HeaderSoundwave } from "@/components/header-soundwave";

const destinations = [
  { href: "/community", label: "Community", Icon: CommunityIcon },
  { href: "/challenges", label: "Challenges", Icon: ChallengesIcon },
  { href: "/skills", label: "Skills", Icon: SkillsIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 bg-navy-900/85 backdrop-blur">
      <div className="spectrum-rule h-0.5" />
      {/* The soundwave lives in the band between the two rules */}
      <div className="relative border-b border-navy-700/80">
        <HeaderSoundwave />
        <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
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
          <DesktopLinks />
        </div>
      </div>
    </header>
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
      className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-600 bg-navy-850/95 backdrop-blur sm:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
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
