import { NextResponse } from "next/server";
import { listJson } from "@/lib/server/store";

// How many students hold each trophy - counted, never estimated.
//
// WHERE THE NUMBER COMES FROM. The only place the server sees which
// trophies anybody holds is the progress backup (api/backup): every
// student's device sends a copy of its record, badges included, a few
// seconds after anything changes. So this reads those copies and counts.
// The weekly board carries names and XP only, and push subscriptions a
// short progress report without badges, so neither can say this.
//
// WHO COUNTS. A backup of a student who has paid (unlocked) and is not
// the sample student from /try, whose takes all carry "demo-" ids -
// somebody who tried the preview on their own phone must not become a
// member of the cohort. A backup exists only once somebody has recorded
// a take or watched a lesson, so "the cohort" here is the students who
// have started. One student on two devices is two backups and counts
// twice; until accounts are on there is nothing that joins them.
//
// WHEN IT SAYS NOTHING. Under MIN_COUNTED students a percentage says
// more about the one or two people behind it than about the trophy, so
// the route returns no figures at all and the case shows none.
//
// It reads every backup, so the answer is kept for an hour - rarity
// does not move fast enough to be worth reading the whole store on
// every visit to the trophy case.

const MIN_COUNTED = 10;
const KEEP_MS = 60 * 60 * 1000;

interface Backup {
  state?: {
    unlocked?: boolean;
    attempts?: { id?: string }[];
    badges?: { id?: string }[];
  };
}

export interface RarityReport {
  /** Students counted. */
  counted: number;
  /** How many of them hold each trophy - null under MIN_COUNTED. */
  held: Record<string, number> | null;
}

let kept: { at: number; report: RarityReport } | null = null;

async function count(): Promise<RarityReport> {
  const rows = await listJson<Backup>("backup/");
  const held: Record<string, number> = {};
  let counted = 0;
  for (const { data } of rows) {
    const s = data.state;
    if (!s?.unlocked) continue;
    const attempts = s.attempts ?? [];
    if (attempts.length > 0 && attempts.every((a) => String(a.id ?? "").startsWith("demo-"))) continue;
    counted += 1;
    for (const id of new Set((s.badges ?? []).map((b) => b.id).filter(Boolean) as string[])) {
      held[id] = (held[id] ?? 0) + 1;
    }
  }
  return { counted, held: counted >= MIN_COUNTED ? held : null };
}

export async function GET() {
  if (!kept || Date.now() - kept.at > KEEP_MS) {
    try {
      kept = { at: Date.now(), report: await count() };
    } catch {
      // No store configured (a local checkout) or it is unreachable:
      // no figures, rather than an error the case would have to show.
      return NextResponse.json({ counted: 0, held: null } satisfies RarityReport);
    }
  }
  return NextResponse.json(kept.report, {
    headers: { "cache-control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
