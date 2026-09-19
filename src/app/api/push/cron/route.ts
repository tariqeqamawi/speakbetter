import { NextResponse } from "next/server";
import { allPush, localNow, pushConfigured, savePush, sendPush, type Note, type PushRecord } from "@/lib/server/push";

// Runs every hour (vercel.json). For each subscribed device it works
// out the local time and sends at most one note, and only one that is
// true of what the device last reported:
//
//   19:00 local  streak nudge, if today's practice hasn't happened and
//                there's a streak worth keeping (or a day already gone)
//   Monday 09:00 the week's recap
//   any hour     next rank within 60 XP (once per rank)
//   any hour     improving on a challenge (once per challenge)
//
// Rationing: one note a day at most, per device, whatever the kind.

export const maxDuration = 120;

function today(record: PushRecord): { hour: number; day: string; weekday: number } {
  return localNow(record.reported.tzOffset);
}

function sentToday(record: PushRecord, day: string): boolean {
  return Object.values(record.sent).some((iso) => iso && localNow(record.reported.tzOffset, new Date(iso)).day === day);
}

function pick(record: PushRecord): { kind: keyof PushRecord["sent"]; note: Note } | null {
  const r = record.reported;
  const { hour, day, weekday } = today(record);
  if (sentToday(record, day)) return null;

  // Monday morning: the recap.
  if (weekday === 1 && hour === 9 && record.sent.recap?.slice(0, 10) !== new Date().toISOString().slice(0, 10)) {
    return {
      kind: "recap",
      note: {
        title: "Your week, in colors",
        body: `${r.colorsLit} of 7 colors lit in your talks so far, ${r.xp.toLocaleString()} XP to your name, ${
          r.streak > 1 ? `a ${r.streak}-day streak running` : "a fresh week ahead"
        }. Keep going.`,
        url: "/profile",
        tag: "recap",
      },
    };
  }

  // Evening: the streak, if today isn't done.
  if (hour === 19 && r.lastPracticeDay !== day && (r.streak >= 2 || r.lastPracticeDay)) {
    return {
      kind: "streak",
      note: {
        title: r.streak >= 2 ? `${r.streak} days running - keep it` : "A quick take keeps it going",
        body:
          r.streak >= 2
            ? "One short take tonight keeps the streak. Thirty seconds to a lens is enough."
            : "Yesterday counted. Record something short today and it becomes a streak.",
        url: "/challenges",
        tag: "streak",
      },
    };
  }

  // Within reach of the next rank, once per rank.
  if (r.nextRank && record.rankSentFor !== r.nextRank.name) {
    const toGo = r.nextRank.at - r.xp;
    if (toGo > 0 && toGo <= 60) {
      return {
        kind: "rank",
        note: {
          title: `${toGo} XP from ${r.nextRank.name}`,
          body: r.nextRank.opens
            ? `${r.nextRank.name} opens ${r.nextRank.opens}. A lesson or two, or a better take, gets you there.`
            : `A lesson or two, or a better take on a challenge you've passed, gets you there.`,
          url: "/challenges",
          tag: "rank",
        },
      };
    }
  }

  // Getting better at a challenge, once per challenge.
  if (r.improving && record.improvingSentFor !== r.improving.challenge && r.improving.pct >= 5) {
    return {
      kind: "improving",
      note: {
        title: `Improving about ${Math.round(r.improving.pct)}% a take`,
        body: `Your last three takes on "${r.improving.challenge}" each scored higher than the one before. Well done - that's the work showing.`,
        url: "/profile",
        tag: "improving",
      },
    };
  }
  return null;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "No." }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ sent: 0, reason: "push not configured" });

  let sent = 0;
  for (const { studentId, record } of await allPush()) {
    const choice = pick(record);
    if (!choice) continue;
    const went = await sendPush(studentId, record, choice.note);
    if (!went) continue;
    sent++;
    record.sent[choice.kind] = new Date().toISOString();
    if (choice.kind === "rank") record.rankSentFor = record.reported.nextRank?.name;
    if (choice.kind === "improving") record.improvingSentFor = record.reported.improving?.challenge;
    await savePush(studentId, record);
  }
  return NextResponse.json({ sent });
}
