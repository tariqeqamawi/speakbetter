import type { Metadata } from "next";
import { LiveSessions } from "@/components/live-sessions";
import { LiveIcon } from "@/components/icons";
import { cohort } from "@/data/cohort";

export const metadata: Metadata = {
  title: "Live sessions",
};

export default function LivePage() {
  return (
    <div className="flex flex-col gap-5 pb-10 pt-4">
      <header className="flex flex-col gap-2">
        <span className="flex items-center gap-2.5">
          <LiveIcon className="size-7 shrink-0 text-acting" />
          <h1 className="text-3xl font-semibold tracking-tight">Live sessions</h1>
        </span>
        <p className="max-w-xl text-sm text-ink-muted text-balance">
          Six live calls across the {cohort.weeks} weeks, all of them hot-seat coaching: students speak on
          camera and Tariq works with them there and then. Watching somebody else be coached is most of the
          value, so come even when you don&apos;t want the chair. Every session is recorded and kept here.
        </p>
      </header>
      <LiveSessions />
    </div>
  );
}
