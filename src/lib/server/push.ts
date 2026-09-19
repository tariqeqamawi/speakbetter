import webpush, { type PushSubscription } from "web-push";
import { delJson, getJson, listJson, putJson } from "@/lib/server/store";

// Push notifications (master plan §11): positive reinforcement that is
// true. Five kinds, and no others - no "come back" pings:
//
//   review      your review is ready (the one with plain utility - a
//               review takes a minute or two and people leave the page)
//   streak      an evening nudge if today's practice hasn't happened
//   recap       one a week: colors reached, XP earned
//   rank        you're within reach of the next rank, and what it opens
//   improving   your last takes on a challenge are each better than the
//               one before
//
// The app is local-first, so the server knows only what a device
// reports when it subscribes and on each open: streak, XP, the last
// practice day, the best spectrum, an improvement figure. The cron
// reads those and decides. Everything sent must be true of the record.

export interface Reported {
  /** Local time zone offset in minutes, as Date#getTimezoneOffset. */
  tzOffset: number;
  lastPracticeDay?: string; // yyyy-mm-dd, local
  streak: number;
  xp: number;
  nextRank?: { name: string; at: number; opens?: string };
  colorsLit: number;
  /** A challenge whose last three takes each scored higher, and by how much on average. */
  improving?: { challenge: string; pct: number };
  displayName?: string;
}

export interface PushRecord {
  subscription: PushSubscription;
  reported: Reported;
  /** When each kind was last sent, to keep the rationing honest. */
  sent: Partial<Record<"review" | "streak" | "recap" | "rank" | "improving", string>>;
  /** Which rank the rank note was last sent for, and which challenge the improving note. */
  rankSentFor?: string;
  improvingSentFor?: string;
  updatedAt: string;
}

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@speakbetter.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export const pushPath = (studentId: string) => `push/${studentId}.json`;

export async function loadPush(studentId: string): Promise<PushRecord | null> {
  return getJson<PushRecord>(pushPath(studentId));
}

export async function savePush(studentId: string, record: PushRecord): Promise<void> {
  await putJson(pushPath(studentId), record);
}

export async function allPush(): Promise<{ studentId: string; record: PushRecord }[]> {
  const rows = await listJson<PushRecord>("push/");
  return rows.map((r) => ({ studentId: r.path.slice(5, -5), record: r.data }));
}

export interface Note {
  title: string;
  body: string;
  /** Where a tap goes. */
  url: string;
  tag: string;
}

/** Send one note; a dead subscription is removed. Returns whether it went. */
export async function sendPush(studentId: string, record: PushRecord, note: Note): Promise<boolean> {
  if (!pushConfigured()) return false;
  configure();
  try {
    await webpush.sendNotification(record.subscription, JSON.stringify(note), { TTL: 60 * 60 * 12 });
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await delJson(pushPath(studentId));
    else console.error("[push] failed", studentId, status);
    return false;
  }
}

/** The local hour and date for a reported offset. */
export function localNow(tzOffset: number, now = new Date()): { hour: number; day: string; weekday: number } {
  const local = new Date(now.getTime() - tzOffset * 60_000);
  return {
    hour: local.getUTCHours(),
    day: local.toISOString().slice(0, 10),
    weekday: local.getUTCDay(),
  };
}
