"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const destinations = [
  { href: "/community", label: "Community" },
  { href: "/challenges", label: "Challenges" },
  { href: "/skills", label: "Skills" },
] as const;

function DestinationIcon({ href }: { href: string }) {
  // Minimal inline icons; swapped for lucide-react when components arrive.
  switch (href) {
    case "/community":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" strokeLinecap="round" />
          <circle cx="17" cy="9.5" r="2.4" />
          <path d="M16 14.6c2.2.2 3.9 1.7 4.4 4.4" strokeLinecap="round" />
        </svg>
      );
    case "/challenges":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.8" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "/skills":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 bg-navy-900/90 backdrop-blur">
      <div className="spectrum-rule h-0.5" />
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Speak Better
        </Link>
        <DesktopLinks />
      </div>
    </header>
  );
}

function DesktopLinks() {
  const pathname = usePathname();
  const { state, ready } = useStore();
  if (!ready || !state.unlocked) return null;
  return (
    <nav className="hidden gap-6 sm:flex" aria-label="Primary">
      {destinations.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? "text-sm font-medium text-ink"
                : "text-sm font-medium text-ink-faint transition-colors hover:text-ink-muted"
            }
            aria-current={active ? "page" : undefined}
          >
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
        {destinations.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium ${
                active ? "text-ink" : "text-ink-faint"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <DestinationIcon href={href} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
