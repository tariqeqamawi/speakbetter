"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STORAGE_KEY } from "@/lib/store";
import { challengeBySlug } from "@/data/challenges";
import { CheckIcon } from "@/components/icons";

// Putting a student's takes back on a device that forgot them.
//
// Reached with the device id in the link. Nothing happens until the
// button is pressed, and what it does is MERGE - anything already on
// this device stays, and an attempt that is already here is left
// alone. A restore that quietly overwrote newer work would be a worse
// bug than the one it is fixing.

/** What is on THIS device right now, worth carrying somewhere else. */
interface Local {
  id: string;
  attempts: number;
  lessons: number;
  badges: number;
  streak: number;
}

interface Restored {
  attemptId: string;
  challengeSlug: string;
  durationSec?: number;
  at?: string;
  score?: number;
  passed?: boolean;
  [key: string]: unknown;
}

/**
 * What this browser is holding, read once at mount.
 *
 * Shown so somebody can tell at a glance WHICH address has their work
 * on it - which is the actual question when the same app is served
 * from two, and storage cannot see across the gap.
 */
function readLocal(): Local | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as {
      attempts?: unknown[];
      watchedLessons?: unknown[];
      badges?: unknown[];
      frozenDays?: unknown[];
    };
    const attempts = s.attempts?.length ?? 0;
    const lessons = s.watchedLessons?.length ?? 0;
    if (attempts === 0 && lessons === 0) return null;
    return {
      id: window.localStorage.getItem("speak-better-student-id") ?? "",
      attempts,
      lessons,
      badges: s.badges?.length ?? 0,
      streak: s.frozenDays?.length ?? 0,
    };
  } catch {
    return null;
  }
}

function RestoreInner() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";

  const [mine] = useState<Local | null>(readLocal);
  const [saved, setSaved] = useState<"no" | "saving" | "yes">("no");
  const [full, setFull] = useState<Record<string, unknown> | null>(null);
  const [found, setFound] = useState<Restored[] | null>(null);
  // Starts as "loading" rather than being set to it inside the effect:
  // a synchronous setState in an effect is an extra render before the
  // first paint, and lint is right to object to it.
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("loading");
  const [added, setAdded] = useState(0);

  useEffect(() => {
    if (!id) {
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/restore?studentId=${encodeURIComponent(id)}`);
        const data = (await res.json()) as {
          attempts?: Restored[];
          backup?: { at: string | null; state: Record<string, unknown> } | null;
        };
        if (!alive) return;
        setFound(data.attempts ?? []);
        setFull(data.backup?.state ?? null);
        setState("idle");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  /** Push this device's record to our side so another address can
   *  pull it down. Storage cannot cross an origin; this can. */
  const carry = async () => {
    if (!mine?.id) return;
    setSaved("saving");
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: mine.id, state: JSON.parse(raw ?? "{}") }),
      });
      setSaved(res.ok ? "yes" : "no");
    } catch {
      setSaved("no");
    }
  };

  /** The whole record, where a backup exists - not just the takes. */
  const restoreFull = () => {
    if (!full) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...full, unlocked: true }));
      window.localStorage.setItem("speak-better-student-id", id);
      const n = Array.isArray((full as { attempts?: unknown[] }).attempts)
        ? ((full as { attempts?: unknown[] }).attempts as unknown[]).length
        : 0;
      setAdded(n);
      setState("done");
    } catch {
      setState("error");
    }
  };

  const restore = () => {
    if (!found?.length) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const now = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      const have = Array.isArray(now.attempts) ? (now.attempts as { id?: string }[]) : [];
      const known = new Set(have.map((a) => a.id));

      const incoming = found
        .filter((a) => !known.has(a.attemptId))
        .map((a) => {
          const { attemptId, challengeSlug, durationSec, at, ...review } = a;
          return {
            id: attemptId,
            challengeSlug,
            at: at ?? new Date().toISOString(),
            durationSec: durationSec ?? 0,
            ...review,
          };
        });

      const merged = {
        ...now,
        unlocked: true,
        attempts: [...have, ...incoming].sort((a, b) =>
          String((a as { at?: string }).at ?? "").localeCompare(String((b as { at?: string }).at ?? "")),
        ),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      // And remember the id, so this device is the same student again
      // and any future review parked server-side finds its way home.
      window.localStorage.setItem("speak-better-student-id", id);
      setAdded(incoming.length);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Restore your takes</h1>
        <p className="text-sm text-ink-muted text-balance">
          Your recordings and the reviews Coach wrote are kept on our side for a short while after each take.
          This puts them back on this device.
        </p>
      </header>

      {!id && (
        <p className="rounded-xl border border-acting/40 bg-acting/10 p-4 text-sm text-ink-muted">
          This link needs your device id on the end of it - <code className="text-ink">/restore?id=…</code>
        </p>
      )}

      {state === "error" && (
        <p className="rounded-xl border border-acting/40 bg-acting/10 p-4 text-sm text-ink-muted">
          That didn&apos;t work. Nothing has been changed on this device.
        </p>
      )}

      {found && found.length === 0 && state !== "done" && (
        <p className="rounded-xl border border-navy-600 bg-navy-800 p-4 text-sm text-ink-muted">
          Nothing found for that id.
        </p>
      )}

      {/* This device is holding something. Say so loudly - when the
          same app is served from two addresses, knowing WHICH one has
          the work is the whole problem. */}
      {mine && state !== "done" && (
        <div className="flex flex-col gap-3 rounded-xl border border-mindset/40 bg-mindset/10 p-4">
          <p className="text-sm font-semibold text-ink">
            This address has your work on it.
          </p>
          <p className="text-xs text-ink-muted">
            {mine.attempts} take{mine.attempts === 1 ? "" : "s"}, {mine.lessons} lesson
            {mine.lessons === 1 ? "" : "s"} watched, {mine.badges} trophies.
          </p>
          {mine.id && (
            <>
              <button
                type="button"
                onClick={() => void carry()}
                disabled={saved === "saving"}
                className="flex min-h-11 items-center justify-center rounded-full bg-mindset text-sm font-bold text-navy-950 disabled:opacity-60"
              >
                {saved === "saving" ? "Saving…" : saved === "yes" ? "Saved" : "Save it so another address can pull it"}
              </button>
              {saved === "yes" && (
                <p className="break-all text-xs text-ink-muted">
                  Saved. On the other address open{" "}
                  <span className="font-semibold text-ink">/restore?id={mine.id}</span>
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* A full backup beats the parked reviews - it has the lessons,
          the trophies and the streak in it, not only the takes. */}
      {full && state !== "done" && (
        <div className="flex flex-col gap-3 rounded-xl border border-storytelling/40 bg-storytelling/10 p-4">
          <p className="text-sm font-semibold text-ink">A full backup was found.</p>
          <p className="text-xs text-ink-muted">
            Everything: takes, lessons watched, trophies and your streak.
          </p>
          <button
            type="button"
            onClick={restoreFull}
            className="flex min-h-11 items-center justify-center rounded-full bg-storytelling text-sm font-bold text-navy-950"
          >
            Restore everything to this device
          </button>
        </div>
      )}

      {found && found.length > 0 && state !== "done" && (
        <>
          <ul className="flex flex-col gap-2">
            {found.map((a) => {
              const c = challengeBySlug.get(a.challengeSlug);
              return (
                <li
                  key={a.attemptId}
                  className="flex items-center gap-3 rounded-xl border border-navy-600 bg-navy-800 p-3"
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums ${
                      a.passed ? "bg-mindset/15 text-mindset" : "bg-navy-700 text-ink-faint"
                    }`}
                  >
                    {a.score ?? "-"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-ink">
                      {c?.title ?? a.challengeSlug}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {a.at ? new Date(a.at).toLocaleDateString(undefined, { day: "numeric", month: "long" }) : ""}
                      {a.passed ? " · passed" : " · missed"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={restore}
            className="flex min-h-12 items-center justify-center rounded-full bg-mindset text-sm font-bold text-navy-950"
          >
            Put these back on this device
          </button>

          <p className="text-xs text-ink-faint text-balance">
            This only adds. Anything already on this device stays exactly as it is. Lessons you watched, badges
            and streak days were only ever stored in your browser, so those can&apos;t be brought back - the
            takes and their reviews can.
          </p>
        </>
      )}

      {state === "done" && (
        <div className="flex flex-col gap-4">
          <p className="flex items-start gap-2 rounded-xl border border-mindset/40 bg-mindset/10 p-4 text-sm text-ink">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-mindset" />
            {added > 0
              ? `${added} take${added === 1 ? "" : "s"} restored, with the reviews Coach wrote for them.`
              : "Everything here was already on this device - nothing needed adding."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex min-h-12 items-center justify-center rounded-full bg-ink text-sm font-bold text-navy-950"
          >
            Go to your dashboard
          </button>
        </div>
      )}
    </main>
  );
}

// useSearchParams has to sit inside a Suspense boundary or the page
// cannot be prerendered - the query string is not known at build time.
export default function RestorePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-10">
          <p className="text-sm text-ink-faint">Looking…</p>
        </main>
      }
    >
      <RestoreInner />
    </Suspense>
  );
}
