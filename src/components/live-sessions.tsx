"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  isPast,
  nextPlanned,
  plannedSessions,
  type PlannedSession,
} from "@/data/live-schedule";
import { readSessions, type LiveSession } from "@/lib/live";
import { challengeBySlug } from "@/data/challenges";
import { CalendarIcon, ChevronDownIcon, LiveIcon, PlayIcon, LockIcon } from "@/components/icons";
import { SUPPORT_EMAIL } from "@/data/support";

// The live sessions: the next one, and everything already behind us.
//
// WHAT THIS PAGE IS FOR. The call itself is on Zoom - every session is
// hot-seat coaching, students on camera being worked with, and a
// two-way room is the expensive half of live video to build. What the
// app owns is the part that compounds: knowing when the next one is,
// getting in with one tap, and the library of every session that has
// already happened.
//
// The library is the bit that is easy to underrate. A student who
// joins in week three can watch weeks one and two. A student who was
// in the hot seat can go back to their own ten minutes whenever they
// like. Over a cohort that is worth more than owning the video pipe
// would have been.
//
// The schedule comes from the repo (data/live-schedule) so six dates
// decided in advance are right and reviewable. Recordings come from
// the database once it is configured, and win where they overlap.

/** "Saturday 3 October, 11:00" - the whole answer in one line. */
function stamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

export function LiveSessions() {
  // Recordings, when there is a database to hold them. Without one the
  // schedule still stands on its own - which is the state this is
  // being built and looked at in.
  const [recorded, setRecorded] = useState<Map<string, LiveSession>>(new Map());

  useEffect(() => {
    let alive = true;
    void (async () => {
      const rows = await readSessions();
      if (!alive) return;
      // Matched by week, which is the one thing both sides agree on.
      const byWeek = new Map<string, LiveSession>();
      for (const r of rows) {
        const week = /week[- ]?(\d)/i.exec(r.title)?.[1];
        if (week) byWeek.set(`week-${week}`, r);
      }
      setRecorded(byWeek);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const next = useMemo(() => nextPlanned(), []);

  return (
    <div className="flex flex-col gap-6">
      {next && <NextSession session={next} recording={recorded.get(next.id)} />}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink">All six sessions</h2>
        <ul className="flex flex-col gap-2.5">
          {plannedSessions.map((s) => (
            <li key={s.id}>
              <SessionCard session={s} recording={recorded.get(s.id)} highlight={s.id === next?.id} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-ink-faint text-balance">
        Sessions run on Zoom and the recording is posted here afterwards, usually within a day. Can&apos;t get in,
        or missed one that hasn&apos;t appeared? Email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}

/** The one at the top: what a student came to this page to find out. */
function NextSession({ session, recording }: { session: PlannedSession; recording?: LiveSession }) {
  const past = isPast(session);
  const onNow = recording?.onNow ?? (!past && countdown(session.heldAt) === "now");
  const join = recording?.joinUrl;

  return (
    <section
      className={`relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 ${
        onNow ? "spectrum-edge bg-navy-800" : "border-navy-600 bg-navy-800"
      }`}
    >
      <span className="relative flex items-center gap-2">
        {onNow ? (
          <>
            <LiveIcon className="size-5 shrink-0 animate-pulse text-acting" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-acting">Live now</span>
          </>
        ) : (
          <>
            <CalendarIcon className="size-5 shrink-0 text-figurative" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-figurative">
              {past ? "Most recent session" : `Next session · ${countdown(session.heldAt)}`}
            </span>
          </>
        )}
      </span>

      <div className="relative flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-ink text-balance">{session.title}</h2>
        <p className="text-sm font-medium text-ink-muted">{stamp(session.heldAt)}</p>
        <p className="max-w-2xl text-sm text-ink-muted text-balance">{session.blurb}</p>
      </div>

      <div className="relative flex flex-wrap items-center gap-2.5">
        {onNow && join ? (
          <a
            href={join}
            target="_blank"
            rel="noreferrer"
            className="coach-pill flex min-h-12 items-center gap-2 rounded-full px-6 text-base font-bold text-navy-950"
          >
            <LiveIcon className="size-5" />
            Join the session
          </a>
        ) : recording?.vimeoId ? (
          <Link
            href={`/live/${session.id}`}
            className="flex min-h-12 items-center gap-2 rounded-full bg-mindset px-6 text-base font-bold text-navy-950 transition-transform hover:scale-[1.02]"
          >
            <PlayIcon className="size-5" />
            Watch it back
          </Link>
        ) : past ? (
          <span className="flex min-h-11 items-center gap-2 rounded-full border border-navy-600 px-5 text-sm text-ink-faint">
            Recording coming soon
          </span>
        ) : (
          <span className="flex min-h-11 items-center gap-2 rounded-full border border-navy-600 px-5 text-sm text-ink-muted">
            <LockIcon className="size-4" />
            The link appears here on the day
          </span>
        )}
      </div>

      <Worked session={session} />
    </section>
  );
}

function SessionCard({
  session,
  recording,
  highlight,
}: {
  session: PlannedSession;
  recording?: LiveSession;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const past = isPast(session);
  const watchable = Boolean(recording?.vimeoId);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border bg-navy-800 ${
        highlight ? "border-figurative/45" : "border-navy-600"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums ${
            watchable
              ? "bg-mindset/15 text-mindset"
              : past
                ? "bg-navy-700 text-ink-faint"
                : "bg-figurative/15 text-figurative"
          }`}
        >
          {session.week}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-ink">{session.title}</span>
          <span className="text-xs text-ink-faint">
            {stamp(session.heldAt)}
            {watchable ? " · recording up" : past ? " · recording coming" : ` · ${countdown(session.heldAt)}`}
          </span>
        </span>

        {watchable && <PlayIcon className="size-4 shrink-0 text-mindset" />}
        <ChevronDownIcon
          className={`size-4 shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-navy-700 px-4 py-3.5">
          <p className="text-sm text-ink-muted text-balance">{session.blurb}</p>
          <Worked session={session} />
          {watchable && (
            <Link
              href={`/live/${session.id}`}
              className="flex min-h-11 w-fit items-center gap-2 rounded-full bg-mindset px-5 text-sm font-bold text-navy-950"
            >
              <PlayIcon className="size-4" />
              Watch it back
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** Which challenges the session works on - and a way straight to them.
 *  A session is far more useful when you have done the thing it is
 *  about, so this doubles as a to-do list before the call. */
function Worked({ session }: { session: PlannedSession }) {
  const challenges = session.relatedSlugs
    .map((slug) => challengeBySlug.get(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (!challenges.length) return null;

  return (
    <div className="relative flex flex-col gap-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
        What we work on
      </span>
      <span className="flex flex-wrap gap-1.5">
        {challenges.map((c) => (
          <Link
            key={c.slug}
            href={`/challenges/${c.slug}`}
            className="rounded-full border border-navy-600 px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
          >
            {c.title}
          </Link>
        ))}
      </span>
    </div>
  );
}
