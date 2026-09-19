import type { AppState } from "@/lib/store";
import { challenges, storyPhases } from "@/data/challenges";
import { categories } from "@/data/categories";
import { standing, phaseRank } from "@/lib/progress";
import { currentStreak } from "@/data/badges";
import { studentId } from "@/lib/student-id";

// The device's side of push (lib/server/push.ts): asking, subscribing,
// and reporting the handful of true figures the server decides on.
// Nothing is sent until the student says yes, and "no" is remembered
// so they're never asked twice.

const ASKED_KEY = "speak-better-push-asked";
const ON_KEY = "speak-better-push-on";
const PENDING_KEY = "speak-better-review-pending";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** On an iPhone, push only works once the app is on the home screen. */
export function needsInstallForPush(): boolean {
  if (typeof window === "undefined") return false;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function pushAsked(): boolean {
  try {
    return window.localStorage.getItem(ASKED_KEY) === "1";
  } catch {
    return true;
  }
}

export function pushOn(): boolean {
  try {
    return window.localStorage.getItem(ON_KEY) === "1";
  } catch {
    return false;
  }
}

function remember(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {}
}

/** The figures the server decides notes on - all true of the record. */
export function reportFor(state: AppState) {
  const rank = standing(state);
  // The next rank, and the phase it opens if it's a gate.
  const opens = rank.next
    ? (["T", "O", "R", "Y"] as const).find((p) => phaseRank(p)?.name === rank.next!.name)
    : undefined;
  const openName = opens ? storyPhases.find((p) => p.id === opens)?.name : undefined;
  const bestSpectrum: Record<string, number> = {};
  for (const a of state.attempts)
    for (const c of categories) bestSpectrum[c.id] = Math.max(bestSpectrum[c.id] ?? 0, a.spectrum[c.id] ?? 0);
  const colorsLit = categories.filter((c) => (bestSpectrum[c.id] ?? 0) >= 40).length;
  const lastAttempt = [...state.attempts].sort((a, b) => (a.at < b.at ? 1 : -1))[0];
  const lastPracticeDay = lastAttempt ? localDay(new Date(lastAttempt.at)) : undefined;

  // A challenge whose last three takes each scored higher: the
  // average step, as a share of the earlier score.
  let improving: { challenge: string; pct: number } | undefined;
  const bySlug = new Map<string, number[]>();
  for (const a of [...state.attempts].sort((x, y) => (x.at < y.at ? -1 : 1)))
    bySlug.set(a.challengeSlug, [...(bySlug.get(a.challengeSlug) ?? []), a.score]);
  for (const [slug, scores] of bySlug) {
    if (scores.length < 3) continue;
    const [a, b, c] = scores.slice(-3);
    if (b > a && c > b && a > 0) {
      const pct = (((b - a) / a + (c - b) / b) / 2) * 100;
      const title = challenges.find((ch) => ch.slug === slug)?.title ?? slug;
      if (!improving || pct > improving.pct) improving = { challenge: title, pct };
    }
  }

  return {
    tzOffset: new Date().getTimezoneOffset(),
    lastPracticeDay,
    streak: currentStreak(state),
    xp: rank.xp,
    nextRank: rank.next
      ? { name: rank.next.name, at: rank.next.at, opens: openName ? `"${openName}" on the journey` : undefined }
      : undefined,
    colorsLit,
    improving,
    displayName: state.displayName || undefined,
  };
}

function localDay(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Ask, subscribe, and send the first report. Resolves to whether it's on. */
export async function enablePush(state: AppState): Promise<boolean> {
  remember(ASKED_KEY, "1");
  if (!pushSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  const keyRes = await fetch("/api/push/subscribe").then((r) => r.json()).catch(() => null);
  const publicKey: string | null = keyRes?.publicKey ?? null;
  if (!publicKey) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) }));
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId: studentId(), subscription: sub.toJSON(), reported: reportFor(state) }),
  });
  if (!res.ok) return false;
  remember(ON_KEY, "1");
  return true;
}

/** Send the latest figures - called on each app open while push is on. */
export async function reportPush(state: AppState): Promise<void> {
  if (!pushOn()) return;
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId: studentId(), reported: reportFor(state) }),
  }).catch(() => {});
}

export async function disablePush(): Promise<void> {
  remember(ON_KEY, null);
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId: studentId(), leave: true }),
  }).catch(() => {});
}

export function declinePush(): void {
  remember(ASKED_KEY, "1");
}

function toKey(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// ── A review the student left behind ─────────────────────────────────

export interface PendingReview {
  attemptId: string;
  challengeSlug: string;
  durationSec: number;
  at: string;
}

export function setPendingReview(p: PendingReview | null): void {
  remember(PENDING_KEY, p ? JSON.stringify(p) : null);
}

export function pendingReview(): PendingReview | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingReview) : null;
  } catch {
    return null;
  }
}

/** Ask the server for a kept review; null if it isn't there (yet). */
export async function fetchKeptReview(p: PendingReview): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/review/result?studentId=${studentId()}&attemptId=${p.attemptId}`, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return null;
  const json = (await res.json()) as { ready: boolean; review?: Record<string, unknown> };
  return json.ready && json.review ? json.review : null;
}
