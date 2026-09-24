"use client";

import { supabase } from "@/lib/supabase/client";

// The live sessions, from the app's side.
//
// The call itself is Zoom - every session is hot-seat coaching, which
// is a two-way room and the expensive half of live video to build.
// What this reads is everything around it: when the next one is, the
// one-tap way in, and the library of what has already happened.

export interface LiveSession {
  id: string;
  cohort: string;
  title: string;
  blurb: string | null;
  heldAt: string;
  durationSec: number | null;
  /** Where to be, while it is still ahead of us. */
  joinUrl: string | null;
  /** Where it lives afterwards. */
  vimeoId: string | null;
  published: boolean;
  relatedSlugs: string[];
  /** Happening right now, give or take the quarter hour before. */
  onNow: boolean;
  upcoming: boolean;
  /** How many people were worked with. */
  seats: number;
}

interface SessionRow {
  id: string;
  cohort: string;
  title: string;
  blurb: string | null;
  held_at: string;
  duration_sec: number | null;
  join_url: string | null;
  vimeo_id: string | null;
  published: boolean;
  related_slugs: string[] | null;
  on_now: boolean;
  upcoming: boolean;
  seats: number;
}

function shape(r: SessionRow): LiveSession {
  return {
    id: r.id,
    cohort: r.cohort,
    title: r.title,
    blurb: r.blurb,
    heldAt: r.held_at,
    durationSec: r.duration_sec,
    joinUrl: r.join_url,
    vimeoId: r.vimeo_id,
    published: r.published,
    relatedSlugs: r.related_slugs ?? [],
    onNow: r.on_now,
    upcoming: r.upcoming,
    seats: r.seats,
  };
}

/** Everything this cohort can see, newest first. */
export async function readSessions(cohort?: string): Promise<LiveSession[]> {
  const db = supabase();
  if (!db) return [];
  let q = db.from("live_schedule").select("*").order("held_at", { ascending: false });
  if (cohort) q = q.eq("cohort", cohort);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as SessionRow[]).map(shape);
}

/**
 * The one to put on the Today card: the session happening now, else
 * the next one coming, else the last one to watch back.
 *
 * One function rather than this arithmetic in three components, which
 * is how two screens end up disagreeing about when the session is.
 */
export function nextUp(sessions: LiveSession[]): LiveSession | null {
  const now = sessions.find((s) => s.onNow);
  if (now) return now;
  const ahead = sessions.filter((s) => s.upcoming).sort((a, b) => a.heldAt.localeCompare(b.heldAt));
  if (ahead.length) return ahead[0];
  return sessions.find((s) => s.published && s.vimeoId) ?? null;
}

/** The sessions that worked on a particular challenge - offered from
 *  the challenge itself, which is where a replay is worth most. */
export async function sessionsForChallenge(slug: string): Promise<LiveSession[]> {
  const db = supabase();
  if (!db) return [];
  const { data, error } = await db
    .from("live_schedule")
    .select("*")
    .contains("related_slugs", [slug])
    .eq("published", true)
    .order("held_at", { ascending: false });
  if (error || !data) return [];
  return (data as SessionRow[]).map(shape);
}

export interface HotSeat {
  sessionId: string;
  studentId: string;
  atSeconds: number;
  endsSeconds: number | null;
  note: string | null;
  challengeSlug: string | null;
}

interface SeatRow {
  session_id: string;
  student_id: string;
  at_seconds: number;
  ends_seconds: number | null;
  note: string | null;
  challenge_slug: string | null;
}

/** Who was worked with in these sessions. */
export async function readHotSeats(sessionIds: string[]): Promise<HotSeat[]> {
  const db = supabase();
  if (!db || !sessionIds.length) return [];
  const { data, error } = await db.from("hot_seats").select("*").in("session_id", sessionIds);
  if (error || !data) return [];
  return (data as SeatRow[]).map((r) => ({
    sessionId: r.session_id,
    studentId: r.student_id,
    atSeconds: r.at_seconds,
    endsSeconds: r.ends_seconds,
    note: r.note,
    challengeSlug: r.challenge_slug,
  }));
}

/**
 * The student's own turns in the seat.
 *
 * Ten minutes of being coached in front of the cohort is the most
 * significant thing that will happen to them in six weeks, and it is
 * buried at 00:34:12 of a ninety-minute recording. This is what turns
 * it into a card they can open.
 */
export async function myHotSeats(): Promise<HotSeat[]> {
  const db = supabase();
  if (!db) return [];
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return [];
  const { data, error } = await db.from("hot_seats").select("*").eq("student_id", me);
  if (error || !data) return [];
  return (data as SeatRow[]).map((r) => ({
    sessionId: r.session_id,
    studentId: r.student_id,
    atSeconds: r.at_seconds,
    endsSeconds: r.ends_seconds,
    note: r.note,
    challengeSlug: r.challenge_slug,
  }));
}

/** Turning up is practice, and the app should be able to say so. */
export async function markAttended(sessionId: string, kind: "live" | "replay"): Promise<boolean> {
  const db = supabase();
  if (!db) return false;
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return false;
  const { error } = await db
    .from("session_attendance")
    .upsert({ session_id: sessionId, student_id: me, kind });
  return !error;
}
