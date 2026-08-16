import Link from "next/link";
import type { ReactNode } from "react";

// The shell every /demo page sits in: a note saying what this is, and a
// way to move between the previews. The store serves these routes an
// ephemeral, pre-populated state (see lib/demo-state), so the pages look
// worked-in without anyone having to unlock or upload anything - and
// nothing here can touch real progress.

const tabs = [
  { href: "/demo", label: "Dashboard" },
  { href: "/demo/challenges", label: "Challenges" },
  { href: "/demo/skills", label: "Skills" },
  { href: "/landing", label: "Landing" },
  { href: "/badges", label: "Badges" },
];

export function DemoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-navy-600 bg-navy-800 px-4 py-3">
        <p className="text-xs text-ink-muted">
          Preview - sample data, shown so the pages have something in them.
          Nothing here is yours, and nothing you click changes your progress.
        </p>
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-full border border-navy-600 px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
