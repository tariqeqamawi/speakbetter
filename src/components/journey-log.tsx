"use client";

import { useMemo, useState } from "react";
import commits from "@/data/journey-commits.json";
import { AREAS, type Area } from "@/data/journey";

// Every change, as it was committed - searchable, filterable by area,
// grouped by day. Plans and notes (requests.md, the master plan, logs)
// are hidden unless asked for: they record work rather than being it.

type Commit = { d: string; h: string; s: string; t: Area };
const ALL = commits as Commit[];

function day(iso: string) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function JourneyLog() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<Area | "all">("all");
  const [notes, setNotes] = useState(false);

  const counts = useMemo(() => {
    const c: Partial<Record<Area, number>> = {};
    for (const x of ALL) c[x.t] = (c[x.t] ?? 0) + 1;
    return c;
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ALL.filter(
      (x) =>
        (notes || x.t !== "notes" || area === "notes") &&
        (area === "all" || x.t === area) &&
        (!needle || x.s.toLowerCase().includes(needle)),
    );
  }, [q, area, notes]);

  const days = useMemo(() => {
    const m = new Map<string, Commit[]>();
    for (const x of shown) m.set(x.d, [...(m.get(x.d) ?? []), x]);
    return [...m.entries()].reverse();
  }, [shown]);

  const chip = (
    key: Area | "all",
    label: string,
    n: number,
    color?: string,
  ) => (
    <button
      key={key}
      type="button"
      onClick={() => setArea(key)}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        area === key
          ? "border-ink-faint bg-navy-800 text-ink"
          : "border-navy-600 text-ink-muted hover:text-ink"
      }`}
    >
      {color && (
        <span className="size-2 rounded-full" style={{ background: color }} />
      )}
      {label} <span className="tabular-nums text-ink-faint">{n}</span>
    </button>
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search every change - e.g. headline, trophy, glass, WhatsApp"
          className="w-full rounded-xl border border-navy-600 bg-navy-900/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {chip(
            "all",
            "All",
            ALL.filter((x) => notes || x.t !== "notes").length,
          )}
          {(Object.keys(AREAS) as Area[])
            .filter((k) => counts[k] && k !== "notes" && k !== "other")
            .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
            .map((k) => chip(k, AREAS[k].name, counts[k] ?? 0, AREAS[k].color))}
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={notes}
            onChange={(e) => setNotes(e.target.checked)}
          />
          Include plan and note updates ({counts.notes ?? 0})
        </label>
        <p className="text-xs text-ink-faint">
          Showing {shown.length} of {ALL.length} changes, newest first.
        </p>
      </div>
      <ol className="flex flex-col gap-6">
        {days.map(([d, list]) => (
          <li key={d} className="flex flex-col gap-2">
            <h4 className="sticky top-[6.5rem] z-10 flex items-center gap-3 bg-navy-900/90 py-1.5 text-sm font-bold text-ink backdrop-blur">
              {day(d)}{" "}
              <span className="text-xs font-semibold text-ink-faint">
                {list.length} changes
              </span>
            </h4>
            <ul className="flex flex-col divide-y divide-navy-700 rounded-xl border border-navy-600 bg-navy-900/50">
              {list.map((x) => (
                <li
                  key={x.h + x.s}
                  className="flex items-start gap-3 px-4 py-2.5 text-sm"
                >
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ background: AREAS[x.t].color }}
                    title={AREAS[x.t].name}
                  />
                  <span className="min-w-0 flex-1 text-ink-muted text-pretty">
                    {x.s}
                  </span>
                  <code className="hidden shrink-0 font-mono text-[0.65rem] text-ink-faint sm:block">
                    {x.h}
                  </code>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
