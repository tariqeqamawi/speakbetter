"use client";

import { supabase } from "./client";
import type { AppState, Attempt, SharedReel } from "@/lib/store";
import type { Level } from "@/lib/store";
import type { Plan } from "@/data/pricing";

// The student's record, in both places at once.
//
// The browser stays the source of truth while they're using the app -
// it's instant, it works on a plane, and every screen already reads it.
// Supabase is where that record lives between devices: it is written to
// as things happen (one row per attempt, per lesson watched, per badge)
// and read back in full when they sign in somewhere new.
//
// Nothing here throws into the app. A student whose connection drops
// keeps practicing; the next write catches the record up.

/** The shape the app keeps, as the database's rows. */
interface ProfileRow {
  display_name: string | null;
  intention: string | null;
  level: Level;
  plan: Plan;
  avatar_url: string | null;
  freezes_remaining: number;
  xp_spent: number;
  on_board: boolean;
}

interface AttemptRow {
  id: string;
  challenge_slug: string;
  at: string;
  duration_sec: number;
  passed: boolean;
  score: number;
  spectrum: Attempt["spectrum"];
  review: Record<string, unknown>;
  voice: Attempt["voice"] | null;
}

/** Any query, with its failure swallowed - the app never waits on the
 *  network to keep working, and a dropped write is caught up by the
 *  next one. */
async function quiet<T>(query: PromiseLike<{ data: T | null }>): Promise<T | null> {
  try {
    const { data } = await query;
    return data ?? null;
  } catch {
    return null;
  }
}

/** Everything the signed-in student has, as the app's own state. */
export async function pullState(): Promise<Partial<AppState> | null> {
  const db = supabase();
  if (!db) return null;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return null;

  const [profile, attempts, watched, badges, streak, chests, shares] = await Promise.all([
    quiet(db.from("profiles").select("*").eq("id", me).single()),
    quiet(db.from("attempts").select("*").eq("student_id", me).order("at", { ascending: true })),
    quiet(db.from("watched_lessons").select("vimeo_id").eq("student_id", me)),
    quiet(db.from("badges").select("badge_id, earned_at").eq("student_id", me)),
    quiet(db.from("streak_days").select("day, kind").eq("student_id", me)),
    quiet(db.from("quest_chests").select("day").eq("student_id", me)),
    quiet(db.from("shares").select("*").eq("student_id", me).order("at", { ascending: true })),
  ]);

  const p = (profile ?? null) as ProfileRow | null;
  const rows = ((attempts ?? []) as AttemptRow[]).map(
    (r): Attempt => ({
      id: r.id,
      challengeSlug: r.challenge_slug,
      at: r.at,
      durationSec: r.duration_sec,
      passed: r.passed,
      score: r.score,
      spectrum: r.spectrum,
      voice: r.voice ?? undefined,
      ...(r.review as Omit<Attempt, "id" | "challengeSlug" | "at" | "durationSec" | "passed" | "score" | "spectrum" | "voice">),
    }),
  );

  return {
    unlocked: true,
    displayName: p?.display_name ?? undefined,
    intention: p?.intention ?? undefined,
    level: p?.level ?? "beginner",
    plan: p?.plan ?? "trial",
    avatar: p?.avatar_url ?? undefined,
    freezesRemaining: p?.freezes_remaining ?? 2,
    xpSpent: p?.xp_spent ?? 0,
    attempts: rows,
    watchedLessons: ((watched ?? []) as { vimeo_id: string }[]).map((r) => r.vimeo_id),
    badges: ((badges ?? []) as { badge_id: string; earned_at: string }[]).map((r) => ({
      id: r.badge_id,
      earnedAt: r.earned_at,
      // The title, message and icon are the app's own (data/badges.ts);
      // the database keeps which and when, not the words.
      title: "",
      message: "",
      icon: "trophy",
    })),
    frozenDays: ((streak ?? []) as { day: string; kind: string }[])
      .filter((r) => r.kind !== "practiced")
      .map((r) => r.day),
    questChests: ((chests ?? []) as { day: string }[]).map((r) => r.day),
    sharedReels: ((shares ?? []) as {
      id: string;
      at: string;
      passed: number;
      then_score: number;
      now_score: number;
      then_spectrum: SharedReel["thenSpectrum"];
      now_spectrum: SharedReel["nowSpectrum"];
      then_slug: string | null;
      now_slug: string | null;
    }[]).map((r) => ({
      id: r.id,
      at: r.at,
      passed: r.passed,
      thenSlug: r.then_slug ?? "",
      nowSlug: r.now_slug ?? "",
      thenScore: r.then_score,
      nowScore: r.now_score,
      thenSpectrum: r.then_spectrum,
      nowSpectrum: r.now_spectrum,
    })),
  };
}

/** The profile's own fields, whenever one of them changes. */
export async function pushProfile(state: AppState): Promise<void> {
  const db = supabase();
  if (!db) return;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  await quiet(
    db
      .from("profiles")
      .update({
        display_name: state.displayName ?? null,
        intention: state.intention ?? null,
        level: state.level ?? "beginner",
        plan: state.plan ?? "trial",
        avatar_url: state.avatar ?? null,
        freezes_remaining: state.freezesRemaining,
        xp_spent: state.xpSpent ?? 0,
      })
      .eq("id", me),
  );
}

/** One take, the moment Coach's review lands. */
export async function pushAttempt(attempt: Attempt): Promise<void> {
  const db = supabase();
  if (!db) return;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  const { id, challengeSlug, at, durationSec, passed, score, spectrum, voice, ...review } = attempt;
  await quiet(
    db.from("attempts").upsert({
      id,
      student_id: me,
      challenge_slug: challengeSlug,
      at,
      duration_sec: durationSec,
      passed,
      score,
      spectrum,
      voice: voice ?? null,
      review,
    }),
  );
  await quiet(
    db.from("streak_days").upsert({ student_id: me, day: at.slice(0, 10), kind: "practiced" }),
  );
}

export async function pushWatched(vimeoId: string): Promise<void> {
  const db = supabase();
  if (!db) return;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  await quiet(db.from("watched_lessons").upsert({ student_id: me, vimeo_id: vimeoId }));
}

export async function pushBadges(ids: { id: string; earnedAt: string }[]): Promise<void> {
  const db = supabase();
  if (!db || ids.length === 0) return;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  await quiet(
    db.from("badges").upsert(ids.map((b) => ({ student_id: me, badge_id: b.id, earned_at: b.earnedAt }))),
  );
}

/** A day bought back with XP, or covered by a freeze. */
export async function pushFrozenDay(day: string, bought: boolean): Promise<void> {
  const db = supabase();
  if (!db) return;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  await quiet(db.from("streak_days").upsert({ student_id: me, day, kind: bought ? "bought" : "frozen" }));
}

export async function pushShare(reel: SharedReel): Promise<void> {
  const db = supabase();
  if (!db) return;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  await quiet(
    db.from("shares").upsert({
      id: reel.id,
      student_id: me,
      at: reel.at,
      passed: reel.passed,
      then_score: reel.thenScore,
      now_score: reel.nowScore,
      then_spectrum: reel.thenSpectrum,
      now_spectrum: reel.nowSpectrum,
      then_slug: reel.thenSlug,
      now_slug: reel.nowSlug,
    }),
  );
}
