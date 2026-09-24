"use client";

import Link from "next/link";
import { useMemo } from "react";
import { presence } from "@/data/community-presence";
import { challenges } from "@/data/challenges";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { ChatIcon, ChevronDownIcon, GroupIcon, LeaderboardIcon } from "@/components/icons";

// The community, as a dashboard panel.
//
// Every other tab here is a private record - your challenges, your
// skills, your spectrum, your streak, your trophies. Five screens of
// your own numbers provoke exactly one question that none of them
// answer, which is "and is anybody else doing this?". This is the tab
// that answers it, and it belongs beside them rather than two taps
// away for that reason.
//
// It is a door, not a copy of the community page: who is on your
// challenge, what is in the rooms, and a way through.

export function CommunityPanel() {
  const { ready, isChallengeComplete } = useStore();
  const crowd = useMemo(() => presence(), []);
  if (!ready) return null;

  const mine =
    challenges.find((c) => !c.passive && !isChallengeComplete(c.slug)) ??
    challenges.filter((c) => !c.passive).at(-1)!;
  const here = crowd.find((c) => c.slug === mine.slug);
  const faces = (here?.recent ?? []).slice(0, 5).map((r) => r.name);
  const total = crowd.reduce((n, c) => n + c.count, 0);

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mindset/15 text-mindset">
            <GroupIcon className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-black tabular-nums leading-none text-ink">{total}</span>
            <span className="text-xs text-ink-faint">students on the road right now</span>
          </div>
        </div>

        {faces.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-navy-600 bg-navy-900/60 p-3">
            <span className="flex shrink-0 -space-x-2">
              {faces.map((name) => (
                <Avatar key={name} name={name} className="size-7 ring-2 ring-navy-900" />
              ))}
            </span>
            <span className="min-w-0 flex-1 text-xs leading-snug text-ink-muted">
              on <span className="font-semibold text-ink">{mine.title}</span> with you
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {/* ?from=dash so Community's back link says "Back to Dash".
              This panel is on the dashboard; a back link that says
              Today would send them somewhere they have not been. */}
          <Door href="/community?from=dash" Icon={ChatIcon} label="Chat rooms" note="Three, plus one per challenge" />
          <Door href="/community?from=dash" Icon={LeaderboardIcon} label="Leaderboards" note="Reset every Monday" />
        </div>
      </div>

      <Link
        href="/community?from=dash"
        className="flex min-h-12 items-center justify-center gap-2 border-t border-navy-700 bg-navy-900/60 text-sm font-bold text-mindset transition-colors hover:bg-navy-900"
      >
        Open Community
        <ChevronDownIcon className="size-4 -rotate-90" />
      </Link>
    </section>
  );
}

function Door({
  href,
  Icon,
  label,
  note,
}: {
  href: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  label: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl border border-navy-600 bg-navy-900/60 p-3 transition-colors hover:border-ink-faint"
    >
      <Icon className="size-4 text-ink-faint" />
      <span className="text-xs font-bold text-ink">{label}</span>
      <span className="text-[0.65rem] leading-tight text-ink-faint">{note}</span>
    </Link>
  );
}
