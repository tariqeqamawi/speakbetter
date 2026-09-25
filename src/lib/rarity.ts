"use client";

import { useEffect, useState } from "react";
import type { RarityReport } from "@/app/api/rarity/route";

// "Held by 12% of this cohort", under a trophy.
//
// The figure is only ever a count of real students (see
// api/rarity/route.ts for where it comes from and who is counted). When
// the server has no figures - too few students yet, or no store behind
// it - every lookup here is null and the case simply shows no line.
// Nothing is ever filled in or guessed.

let pending: Promise<RarityReport | null> | null = null;

function load(): Promise<RarityReport | null> {
  pending ??= fetch("/api/rarity")
    .then((r) => (r.ok ? (r.json() as Promise<RarityReport>) : null))
    .catch(() => null);
  return pending;
}

/** The share of the cohort holding a trophy, as a whole percentage, or
 *  null when there is no real figure to show. */
export function rarityOf(report: RarityReport | null, id: string): number | null {
  if (!report?.held || report.counted <= 0) return null;
  const n = report.held[id] ?? 0;
  const pct = (n / report.counted) * 100;
  // Held by somebody but under half a percent still reads as "1%",
  // never "0%" - a trophy nobody holds is 0, one somebody does is not.
  return n > 0 ? Math.max(1, Math.round(pct)) : 0;
}

/** Fetched once per visit, shared by every trophy on the screen. */
export function useRarity(enabled = true): (id: string) => number | null {
  const [report, setReport] = useState<RarityReport | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void load().then((r) => {
      if (alive) setReport(r);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);
  return (id) => rarityOf(report, id);
}
