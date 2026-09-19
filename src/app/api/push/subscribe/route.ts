import { NextResponse } from "next/server";
import { delJson, isStudentId } from "@/lib/server/store";
import { loadPush, pushConfigured, pushPath, savePush, type PushRecord, type Reported } from "@/lib/server/push";

// A device subscribes, or updates what it reports, or leaves. The
// subscription is the browser's own (endpoint and keys); the report is
// the handful of figures the cron decides on (lib/server/push.ts).

function cleanReported(r: Partial<Reported> | undefined): Reported {
  const num = (v: unknown, lo: number, hi: number, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d;
  };
  const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  return {
    tzOffset: num(r?.tzOffset, -900, 900),
    lastPracticeDay: day(r?.lastPracticeDay),
    streak: num(r?.streak, 0, 10_000),
    xp: num(r?.xp, 0, 1_000_000),
    nextRank:
      r?.nextRank && typeof r.nextRank.name === "string"
        ? {
            name: r.nextRank.name.slice(0, 40),
            at: num(r.nextRank.at, 0, 1_000_000),
            opens: typeof r.nextRank.opens === "string" ? r.nextRank.opens.slice(0, 60) : undefined,
          }
        : undefined,
    colorsLit: num(r?.colorsLit, 0, 7),
    improving:
      r?.improving && typeof r.improving.challenge === "string"
        ? { challenge: r.improving.challenge.slice(0, 80), pct: num(r.improving.pct, 0, 1000) }
        : undefined,
    displayName: typeof r?.displayName === "string" ? r.displayName.slice(0, 40) : undefined,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { studentId?: unknown; subscription?: PushRecord["subscription"]; reported?: Partial<Reported>; leave?: boolean }
    | null;
  if (!body || !isStudentId(body.studentId)) return NextResponse.json({ error: "Who?" }, { status: 400 });

  if (body.leave) {
    await delJson(pushPath(body.studentId));
    return NextResponse.json({ ok: true });
  }

  const have = await loadPush(body.studentId);
  const subscription = body.subscription ?? have?.subscription;
  if (!subscription || typeof subscription.endpoint !== "string" || !subscription.endpoint.startsWith("https://"))
    return NextResponse.json({ error: "No subscription." }, { status: 400 });

  const record: PushRecord = {
    subscription,
    reported: cleanReported(body.reported),
    sent: have?.sent ?? {},
    rankSentFor: have?.rankSentFor,
    improvingSentFor: have?.improvingSentFor,
    updatedAt: new Date().toISOString(),
  };
  await savePush(body.studentId, record);
  return NextResponse.json({ ok: true, configured: pushConfigured() });
}

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? null });
}
