"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { ChallengesIcon, CommunityIcon, HomeIcon, ProfileIcon, SkillsIcon } from "@/components/icons";
import { Soundwave } from "@/components/soundwave";
import { LionMouth } from "@/components/lion-mouth";
import { JumpButton } from "@/components/jump";

// Five destinations, one set of names, in the same order everywhere:
// Today, Challenges, Skills, Coach, You. Coach sits in the middle and
// is drawn as the lion himself - he's the thing this app has that
// nothing else does, and he used to live in a pill in the corner while
// everything else lived in a bar at the bottom, which meant two
// navigations to learn instead of one.
//
// Community isn't a destination any more: who else is on the road is
// part of Today, where a student actually asks the question.
//
// On a phone the five are a bottom bar; on a laptop they're a rail down
// the left (see Sidebar), because a header of four links wastes a
// screen that has room to keep the whole map in view.

const destinations = [
  { href: "/", label: "Today", tour: "today", Icon: HomeIcon },
  { href: "/challenges", label: "Challenges", tour: "challenges", Icon: ChallengesIcon },
  { href: "/skills", label: "Skills", tour: "skills", Icon: SkillsIcon },
  // The route stays /profile so existing links keep working; the name a
  // student sees is theirs.
  { href: "/profile", label: "You", tour: "dashboard", Icon: ProfileIcon },
] as const;

/** Today is only "on" at the root; the rest own their whole subtree. */
function isOn(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopBar() {
  return (
    <header className="pt-safe sticky top-0 z-20 bg-navy-900/92">
      <div className="spectrum-rule h-0.5" />
      {/* The soundwave lives in the band between the two rules */}
      <div className="relative border-b border-navy-700/80">
        <Soundwave variant="header" className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 xl:max-w-[96rem]">
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
            <JumpButton />
            <CompactLinks />
          </div>
        </div>
      </div>
    </header>
  );
}

/** The lion's head, as a destination. */
function CoachFace({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`grid place-items-center overflow-hidden rounded-full bg-navy-950/25 ${className}`}>
      <LionMouth level={0} className="w-full translate-y-0.5" />
    </span>
  );
}

/**
 * Tablet width only: the phone's bar is gone and the laptop's rail
 * hasn't arrived, so the destinations ride in the header.
 */
function CompactLinks() {
  const pathname = usePathname();
  const { state, ready } = useStore();
  if (!ready || !state.unlocked) return null;
  return (
    <nav className="hidden gap-1 sm:flex lg:hidden" aria-label="Primary">
      {destinations.map(({ href, label, tour, Icon }) => {
        const active = isOn(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-navy-800 text-ink" : "text-ink-faint hover:text-ink-muted"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/coach"
        data-tour="coach"
        aria-label="Coach"
        className={`coach-pill flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 ${
          pathname.startsWith("/coach") ? "ring-2 ring-ink/70" : ""
        }`}
      >
        <CoachFace />
        <span className="text-xs font-bold tracking-wide text-navy-950">Coach</span>
      </Link>
    </nav>
  );
}

/**
 * The laptop's navigation: a rail down the left, always in view, so
 * moving between sections is one click from anywhere and the section
 * you're in is never in question.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { state, ready } = useStore();
  if (!ready || !state.unlocked) return null;
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col gap-1 border-r border-navy-700/80 bg-navy-900/60 px-3 pb-6 pt-[calc(4.25rem+env(safe-area-inset-top))] lg:flex"
    >
      {destinations.slice(0, 3).map(({ href, label, tour, Icon }) => (
        <RailLink key={href} href={href} label={label} tour={tour} Icon={Icon} active={isOn(pathname, href)} />
      ))}

      {/* Coach, drawn as himself - the one destination that is a person. */}
      <Link
        href="/coach"
        data-tour="coach"
        className={`coach-pill my-1 flex min-h-12 items-center gap-3 rounded-full py-1 pl-1 pr-4 ${
          pathname.startsWith("/coach") ? "ring-2 ring-ink/70" : ""
        }`}
        aria-current={pathname.startsWith("/coach") ? "page" : undefined}
      >
        <CoachFace className="size-10" />
        <span className="text-sm font-bold tracking-wide text-navy-950">Coach</span>
      </Link>

      {destinations.slice(3).map(({ href, label, tour, Icon }) => (
        <RailLink key={href} href={href} label={label} tour={tour} Icon={Icon} active={isOn(pathname, href)} />
      ))}

      {/* Not one of the five - the community lives inside Today - but
          a laptop has room to name the way there. */}
      <RailLink
        href="/community"
        label="Community"
        tour="community"
        Icon={CommunityIcon}
        active={isOn(pathname, "/community")}
      />
    </nav>
  );
}

function RailLink({
  href,
  label,
  tour,
  Icon,
  active,
}: {
  href: string;
  label: string;
  tour: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      data-tour={tour}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
        active ? "bg-navy-800 text-ink" : "text-ink-muted hover:bg-navy-800/60 hover:text-ink"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  const { state, ready } = useStore();
  if (!ready || !state.unlocked) return null;
  const onCoach = pathname.startsWith("/coach");
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-600 bg-navy-850/97 sm:hidden"
      aria-label="Primary"
    >
      <div className="pb-safe mx-auto flex max-w-md items-end justify-around">
        {destinations.slice(0, 2).map(({ href, label, tour, Icon }) => (
          <Tab key={href} href={href} label={label} tour={tour} Icon={Icon} active={isOn(pathname, href)} />
        ))}

        {/* Coach, raised out of the bar: the middle of the thumb's reach,
            and the only tab that looks like somebody rather than a
            symbol. */}
        <Link
          href="/coach"
          data-tour="coach"
          aria-current={onCoach ? "page" : undefined}
          className="flex flex-1 flex-col items-center gap-0.5 pb-2"
        >
          <span
            className={`coach-pill -mt-5 grid size-14 place-items-center rounded-full ${onCoach ? "ring-2 ring-ink/70" : ""}`}
          >
            <CoachFace className="size-12" />
          </span>
          <span className={`text-[0.7rem] font-semibold ${onCoach ? "text-ink" : "text-ink-faint"}`}>Coach</span>
        </Link>

        {destinations.slice(2).map(({ href, label, tour, Icon }) => (
          <Tab key={href} href={href} label={label} tour={tour} Icon={Icon} active={isOn(pathname, href)} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  tour,
  Icon,
  active,
}: {
  href: string;
  label: string;
  tour: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      data-tour={tour}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors ${
        active ? "text-ink" : "text-ink-faint"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
