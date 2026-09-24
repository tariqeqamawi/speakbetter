"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { standing } from "@/lib/progress";
import { studentId } from "@/lib/student-id";
import { TrophyIcon, ZapIcon } from "@/components/icons";

// This week's board (§11, §12): XP earned since Monday, by whoever
// chose to be on it. A student joins with a display name, and from then
// on this device posts their XP whenever it changes; leaving removes
// them from the week. Never all-time: the top is reachable by whoever
// practiced most in the last seven days, and nobody sits on it.

const NAME_KEY = "speak-better-board-name";

interface Board {
  week: string;
  count: number;
  top: { rank: number; name: string; weekXp: number; me: boolean }[];
  me: { rank: number; weekXp: number } | null;
}

function savedName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function WeeklyBoard({ compact = false }: { compact?: boolean }) {
  const { state, ready } = useStore();
  // The saved name is read after mount - it lives in localStorage, and
  // the server renders the same blank the client first shows.
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [busy, setBusy] = useState(false);
  const xp = ready ? standing(state).xp : 0;

  // A blank draft takes the profile's name once the store has loaded.
  const suggested = state.displayName || "";
  const draftShown = draft || suggested;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/board?me=${studentId()}`, { cache: "no-store" });
      if (res.ok) setBoard((await res.json()) as Board);
    } catch {
      // the board is a nicety; the page stands without it
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const n = savedName();
      setName(n);
      setDraft(n);
      load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  // On the board, every change in XP is posted - the board is only as
  // live as the devices on it.
  useEffect(() => {
    if (!name || !ready) return;
    const t = window.setTimeout(() => {
      fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId(), name, xp }),
      })
        .then(load)
        .catch(() => {});
    }, 800);
    return () => window.clearTimeout(t);
  }, [name, xp, ready, load]);

  const join = async () => {
    const n = draftShown.trim().slice(0, 24);
    if (!n) return;
    setBusy(true);
    try {
      window.localStorage.setItem(NAME_KEY, n);
    } catch {}
    setName(n);
    setBusy(false);
  };

  const leave = async () => {
    setBusy(true);
    try {
      window.localStorage.removeItem(NAME_KEY);
    } catch {}
    await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: studentId(), leave: true }),
    }).catch(() => {});
    setName("");
    await load();
    setBusy(false);
  };

  return (
    <section data-tour="boards"
      className="flex flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-ink-faint">
            <TrophyIcon className="size-4 text-storytelling" />
            This week&apos;s leaderboard
          </h2>
          {!compact && (
            <p className="text-xs text-ink-muted">
              XP earned since Monday. It resets every week, so the top is whoever practiced most in the last seven days.
            </p>
          )}
        </div>
        {board && (
          <span className="shrink-0 text-xs tabular-nums text-ink-faint">
            {board.count} on it
          </span>
        )}
      </div>

      {name ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-navy-600 bg-navy-900/60 px-4 py-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-ink">
              {board?.me ? `#${board.me.rank} this week` : "On the board"}
            </span>
            <span className="text-xs text-ink-muted">
              as <b className="font-medium text-ink">{name}</b>
              {board?.me && (
                <>
                  {" "}· <ZapIcon className="inline size-3 -translate-y-px" /> {board.me.weekXp} XP this week
                </>
              )}
            </span>
          </span>
          <button
            type="button"
            onClick={leave}
            disabled={busy}
            className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline"
          >
            Leave
          </button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-900/60 px-4 py-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            join();
          }}
        >
          {/* No name to type. They already told us what they are
              called at onboarding, and asking a second time is asking
              somebody to make the same decision twice - which is where
              a name like "asdf" comes from. */}
          {/* The name comes from their profile; they are not asked for
              it twice. No number is shown, because there honestly is
              not one yet: the board fixes your starting XP the moment
              you join and ranks the difference, so everybody who joins
              today begins this week on zero and climbs from there.
              Printing a figure here would be printing a lie. */}
          <span className="flex-1 text-xs text-ink-muted">
            Joining as <strong className="font-semibold text-ink">{draftShown || "you"}</strong>. Every XP you
            earn from now until Sunday counts - the board resets each week, so the top is whoever practiced most
            in the last seven days.
          </span>
          <button
            type="submit"
            disabled={busy || !draftShown.trim()}
            className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Join leaderboard
          </button>
        </form>
      )}

      {board && board.top.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {(compact ? board.top.slice(0, 3) : board.top).map((row) => (
            <li
              key={row.rank}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                row.me ? "bg-navy-700 text-ink" : "text-ink-muted"
              }`}
            >
              <span
                className={`w-6 text-right text-xs font-bold tabular-nums ${
                  row.rank === 1
                    ? "text-storytelling"
                    : row.rank === 2
                      ? "text-ink"
                      : row.rank === 3
                        ? "text-figurative"
                        : "text-ink-faint"
                }`}
              >
                {row.rank}
              </span>
              <span className="flex-1 truncate font-medium">{row.name}{row.me ? " (you)" : ""}</span>
              <span className="inline-flex items-center gap-1 text-xs tabular-nums">
                <ZapIcon className="size-3" />
                {row.weekXp}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-ink-faint">
          {board ? "Nobody on it yet this week - the first to join leads." : "Loading the board…"}
        </p>
      )}
    </section>
  );
}
