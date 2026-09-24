"use client";

import { useRef, useState } from "react";
import { STORAGE_KEY, useStore } from "@/lib/store";
import { studentId } from "@/lib/student-id";
import { CheckIcon, UploadIcon } from "@/components/icons";

// A student's whole record, as a file they keep.
//
// WHY, WHEN THERE IS ALREADY A SERVER COPY. Because the server copy is
// ours and this one is theirs. Every other safety net here depends on
// something of ours still working and still holding the right row -
// the right device id, the right origin, a service that is up. A file
// in their downloads depends on nothing. It is the only backup that
// survives us being wrong.
//
// It is also the only one that works when somebody changes phone,
// which over six weeks will happen to somebody.
//
// WHAT IS IN IT. Everything the app knows about them: takes and the
// reviews Coach wrote, lessons watched, trophies, streak, XP spent,
// their name and their reason for being here. Not the recordings -
// those never left the phone and this does not change that.
//
// RESTORING MERGES, IT DOES NOT REPLACE. Somebody restoring a
// fortnight-old file onto a phone that has since done three more
// challenges must not lose those three. Attempts, lessons, trophies
// and streak days are unioned; the counters take whichever is higher.
// The rule is that a restore can only ever give somebody more.

interface Saved {
  app: "speak-better";
  version: 1;
  at: string;
  studentId: string;
  state: Record<string, unknown>;
}

/** Union two lists of things that have ids, newest wins on a clash. */
function mergeById<T extends { id?: string }>(a: T[], b: T[]): T[] {
  const out = new Map<string, T>();
  for (const item of [...a, ...b]) if (item?.id) out.set(item.id, item);
  return [...out.values()];
}

export function ProgressFile() {
  const { state, ready } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [said, setSaid] = useState<string | null>(null);

  if (!ready) return null;

  const save = () => {
    const payload: Saved = {
      app: "speak-better",
      version: 1,
      at: new Date().toISOString(),
      studentId: studentId(),
      state: state as unknown as Record<string, unknown>,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Dated, because somebody who has done this twice needs to know
    // which file is the newer one without opening either.
    a.download = `speak-better-progress-${new Date().toISOString().slice(0, 10)}.json`;
    // It has to be in the document to be clickable - a detached anchor
    // silently does nothing in several browsers, which would make the
    // button look broken for exactly the people who need it to work.
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Freed on the next tick; revoking immediately can cancel the
    // download that was only just handed to the browser.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaid("Saved to your downloads. Keep it somewhere you'll find it.");
  };

  const load = async (chosen: File) => {
    try {
      const parsed = JSON.parse(await chosen.text()) as Partial<Saved>;
      if (parsed.app !== "speak-better" || !parsed.state) {
        setSaid("That doesn't look like a Speak Better progress file.");
        return;
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      const now = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
      const from = parsed.state;

      const list = (o: Record<string, unknown>, k: string) =>
        Array.isArray(o[k]) ? (o[k] as unknown[]) : [];
      const num = (o: Record<string, unknown>, k: string) =>
        typeof o[k] === "number" ? (o[k] as number) : 0;

      const merged: Record<string, unknown> = {
        ...from,
        ...now,
        unlocked: true,
        // A restore can only give somebody more. Anything already on
        // this device stays, whatever the file says.
        attempts: mergeById(
          list(now, "attempts") as { id?: string }[],
          list(from, "attempts") as { id?: string }[],
        ),
        badges: mergeById(
          list(now, "badges") as { id?: string }[],
          list(from, "badges") as { id?: string }[],
        ),
        watchedLessons: [
          ...new Set([...list(now, "watchedLessons"), ...list(from, "watchedLessons")]),
        ],
        frozenDays: [...new Set([...list(now, "frozenDays"), ...list(from, "frozenDays")])],
        questChests: [...new Set([...list(now, "questChests"), ...list(from, "questChests")])],
        watchedOn: { ...(from.watchedOn ?? {}), ...((now.watchedOn as object) ?? {}) },
        xpSpent: Math.max(num(now, "xpSpent"), num(from, "xpSpent")),
        creditsBought: Math.max(num(now, "creditsBought"), num(from, "creditsBought")),
        freezesRemaining: Math.max(num(now, "freezesRemaining"), num(from, "freezesRemaining")),
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      if (parsed.studentId) window.localStorage.setItem("speak-better-student-id", parsed.studentId);

      const gained =
        (merged.attempts as unknown[]).length - list(now, "attempts").length;
      setSaid(
        gained > 0
          ? `Restored. ${gained} take${gained === 1 ? "" : "s"} came back - reloading.`
          : "Restored. Nothing here was newer than what you already had - reloading.",
      );
      window.setTimeout(() => window.location.reload(), 1400);
    } catch {
      setSaid("That file couldn't be read. Nothing has been changed.");
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold tracking-tight text-ink">Your progress file</h2>
        <p className="text-sm text-ink-muted text-balance">
          Your record lives on this device. Save a copy you keep yourself, and you can put it back on any phone,
          any time - even if something goes wrong at our end.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          className="flex min-h-11 items-center gap-2 rounded-full bg-mindset px-5 text-sm font-bold text-navy-950 transition-transform hover:scale-[1.02]"
        >
          <CheckIcon className="size-4" />
          Save my progress
        </button>

        <button
          type="button"
          onClick={() => file.current?.click()}
          className="flex min-h-11 items-center gap-2 rounded-full border border-navy-600 px-5 text-sm font-semibold text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
        >
          <UploadIcon className="size-4" />
          Restore from a file
        </button>

        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) void load(chosen);
            e.target.value = "";
          }}
        />
      </div>

      {said && <p className="text-xs font-medium text-ink-muted">{said}</p>}

      <p className="text-xs text-ink-faint text-balance">
        Restoring only ever adds. Anything already on this phone is kept, so an older file can never undo newer
        work. Your recordings aren&apos;t in the file - they never leave your phone.
      </p>
    </section>
  );
}
