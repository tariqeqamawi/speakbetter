"use client";

import { supabase } from "@/lib/supabase/client";
import {
  LOCAL_ME,
  localActivity,
  localRead,
  localReactions,
  localReact,
  localReword,
  localSay,
  localUnsay,
  onLocalChange,
  type LocalPost,
} from "@/lib/chat-local";

// Talking to the rooms. One file, so that every screen that shows
// messages - the three standing rooms, the thread on a challenge -
// goes through the same four calls and behaves the same way.
//
// NOTHING HERE THROWS INTO THE APP. The chat is the one part of Speak
// Better that depends on somebody else's server being up, and it is
// also the least important part: a student whose room fails to load
// should still be able to practice. So every call returns an empty
// result rather than an exception, exactly as the sync layer does.
//
// AND IT WORKS WITH NO SERVER AT ALL. When Supabase is not configured
// every call falls through to chat-local, which is the same four
// operations against localStorage. That is the app's standing rule
// (lib/supabase/config.ts) and the chat does not get to be the
// exception: the demo, the landing previews and local development all
// depend on the room still being a room. The screen behaves
// identically either way, which is also the only way to get the UI
// right before the keys arrive.

/** The three standing rooms, in the order they are shown.
 *
 * `icon` names the mark each one wears, so a tab is recognisable
 * before it is read - which is most of how somebody finds the room
 * they want on a phone, at a glance, with a thumb already moving. */
export const ROOMS = [
  {
    id: "challenges" as const,
    name: "Challenges",
    icon: "challenges" as const,
    blurb: "Which one you are on, what it asked of you, how you got through it.",
  },
  {
    id: "feedback" as const,
    name: "Feedback",
    icon: "feedback" as const,
    blurb: "What Coach said, what you changed, what you would tell somebody starting.",
  },
  {
    id: "general" as const,
    name: "General",
    icon: "general" as const,
    blurb: "Say hello, say where you are in the world, say why you are here.",
  },
];

export type RoomId = (typeof ROOMS)[number]["id"];

/** The room that belongs to one challenge. */
export function challengeRoom(slug: string): string {
  return `challenge:${slug}`;
}

/** The slug back out of a room name, or null if it is a standing room. */
export function roomChallenge(room: string): string | null {
  return room.startsWith("challenge:") ? room.slice("challenge:".length) : null;
}

export interface Post {
  id: string;
  studentId: string;
  room: string;
  cohort: string | null;
  body: string;
  at: string;
  editedAt: string | null;
  replyTo: string | null;
  pinnedAt: string | null;
  authorName: string;
  authorAvatar: string | null;
}

interface PostRow {
  id: string;
  student_id: string;
  room: string;
  cohort: string | null;
  body: string;
  at: string;
  edited_at: string | null;
  reply_to: string | null;
  pinned_at: string | null;
  author_name: string;
  author_avatar: string | null;
}

function shape(r: PostRow | LocalPost): Post {
  return {
    id: r.id,
    studentId: r.student_id,
    room: r.room,
    cohort: r.cohort,
    body: r.body,
    at: r.at,
    editedAt: r.edited_at,
    replyTo: r.reply_to,
    pinnedAt: r.pinned_at,
    authorName: r.author_name || "Someone",
    authorAvatar: r.author_avatar,
  };
}

/** How many messages come back at once. A room is read from the bottom
 *  up, so this is the most recent hundred and "older" fetches back. */
const PAGE = 100;

/**
 * A room's messages, oldest first.
 *
 * `before` walks backwards through the history; leaving it out gets
 * the latest page, which is what opening a room wants.
 */
export async function readRoom(room: string, before?: string): Promise<Post[]> {
  const db = supabase();
  if (!db) return localRead(room).map(shape);
  let q = db
    .from("posts")
    .select("*")
    .eq("room", room)
    .order("at", { ascending: false })
    .limit(PAGE);
  if (before) q = q.lt("at", before);

  const { data, error } = await q;
  if (error || !data) return [];
  // Read newest-first for the index, handed back oldest-first for the
  // screen, which is the order a conversation is read in.
  return (data as PostRow[]).map(shape).reverse();
}

/** Anything Tariq has pinned to the top of this room. */
export async function readPinned(room: string): Promise<Post[]> {
  const db = supabase();
  if (!db) return localRead(room).filter((p) => p.pinned_at).map(shape);
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("room", room)
    .not("pinned_at", "is", null)
    .order("pinned_at", { ascending: false })
    .limit(5);
  if (error || !data) return [];
  return (data as PostRow[]).map(shape);
}

/**
 * Say something.
 *
 * The author is not sent: the database fills it in from whoever is
 * asking, so there is no version of this call that can post as
 * somebody else. Returns the saved post, or null if it did not land -
 * and the caller should show that rather than pretending it sent.
 */
export async function say(
  room: string,
  body: string,
  opts: { cohort?: string; replyTo?: string } = {},
): Promise<Post | null> {
  const db = supabase();
  const text = body.trim();
  if (!text || text.length > 2000) return null;
  if (!db) return shape(localSay(room, text, opts.replyTo));

  const { data, error } = await db
    .from("posts")
    .insert({ room, body: text, cohort: opts.cohort ?? null, reply_to: opts.replyTo ?? null })
    .select("*")
    .single();
  if (error || !data) return null;
  return shape(data as PostRow);
}

/** Fix your own words. */
export async function reword(id: string, body: string): Promise<boolean> {
  const db = supabase();
  const text = body.trim();
  if (!text || text.length > 2000) return false;
  if (!db) return localReword(id, text);
  const { error } = await db.from("posts").update({ body: text }).eq("id", id);
  return !error;
}

/** Take it back. */
export async function unsay(id: string): Promise<boolean> {
  const db = supabase();
  if (!db) return localUnsay(id);
  const { error } = await db.from("posts").delete().eq("id", id);
  return !error;
}

/**
 * What you can say without typing.
 *
 * Six, not three. The original three were all about the CONTENT of a
 * message - it helped, I agree, well done - which is a reasonable set
 * for a course, and a useless one for the thing people actually do in
 * a room, which is to acknowledge each other cheaply and often. A
 * thumbs up is the whole gesture for most messages, and a room where
 * the cheapest reply is a sentence is a room where most messages get
 * no reply at all.
 *
 * Six is also the most that fits a phone's width in one row, which is
 * the real limit: a picker that scrolls is a picker nobody uses past
 * the first three.
 */
export type ReactionKind = "up" | "cheer" | "love" | "fire" | "same" | "helpful";

/** Turn a reaction on or off. Returns where it ended up. */
export async function react(postId: string, kind: ReactionKind, on: boolean): Promise<boolean> {
  const db = supabase();
  if (!db) {
    localReact(postId, kind, on);
    return true;
  }
  if (on) {
    const { error } = await db.from("post_reactions").upsert({ post_id: postId, kind });
    return !error;
  }
  const { data: auth } = await db.auth.getUser();
  const me = auth.user?.id;
  if (!me) return false;
  const { error } = await db
    .from("post_reactions")
    .delete()
    .eq("post_id", postId)
    .eq("kind", kind)
    .eq("student_id", me);
  return !error;
}

/**
 * How many of each reaction the visible posts have.
 *
 * Counted here rather than joined onto the post, because a reaction
 * changes far more often than a message does and a count welded to
 * the post row would mean re-reading the whole room to learn that
 * somebody gave a thumbs up.
 *
 * With no server there is only one person in the room, so the tally
 * is your own reactions - which is the truth, not a placeholder.
 * Inventing plausible numbers for an empty room would be the kind of
 * lie that is discovered the moment a second person arrives.
 */
export async function tallies(postIds: string[]): Promise<Map<string, Record<string, number>>> {
  const out = new Map<string, Record<string, number>>();
  const add = (id: string, kind: string) => {
    const row = out.get(id) ?? {};
    row[kind] = (row[kind] ?? 0) + 1;
    out.set(id, row);
  };

  const db = supabase();
  if (!db) {
    const mine = localReactions();
    for (const id of postIds) for (const kind of mine[id] ?? []) add(id, kind);
    return out;
  }
  if (postIds.length === 0) return out;
  const { data, error } = await db
    .from("post_reactions")
    .select("post_id, kind")
    .in("post_id", postIds);
  // A failed tally is a room with no counts on it, which is a room
  // that still works. Nothing here throws into the app.
  if (error || !data) return out;
  for (const r of data as { post_id: string; kind: string }[]) add(r.post_id, r.kind);
  return out;
}

/** Tell somebody. Quiet by design: no confirmation theatre, and the
 *  reporter is never shown to the room. */
export async function report(postId: string, reason?: string): Promise<boolean> {
  const db = supabase();
  // Nobody to tell, and pretending otherwise would be worse than
  // saying so - the caller shows a real answer either way.
  if (!db) return false;
  const { error } = await db
    .from("post_reports")
    .insert({ post_id: postId, reason: reason?.slice(0, 500) ?? null });
  return !error;
}

/**
 * New messages in a room, as they are said.
 *
 * Returns the unsubscribe. The row arrives complete - the author's
 * name and face are on it - so a message can be drawn the moment it
 * lands with no second request. That is the whole reason those two
 * columns are denormalized; see the schema.
 */
export function watchRoom(
  room: string,
  on: { said?: (p: Post) => void; changed?: (p: Post) => void; gone?: (id: string) => void },
): () => void {
  const db = supabase();
  // With no server, "live" is this tab: chat-local announces its own
  // writes and the room re-reads. Same contract, same unsubscribe.
  if (!db)
    return onLocalChange((changed) => {
      if (changed === room || changed === "*") {
        const latest = localRead(room);
        const last = latest[latest.length - 1];
        if (last) on.said?.(shape(last));
      }
    });

  const channel = db
    .channel(`room:${room}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts", filter: `room=eq.${room}` },
      (payload: Change) => on.said?.(shape(payload.new)),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "posts", filter: `room=eq.${room}` },
      (payload: Change) => on.changed?.(shape(payload.new)),
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "posts", filter: `room=eq.${room}` },
      (payload: Change) => on.gone?.(payload.old.id),
    )
    .subscribe();

  return () => {
    void db.removeChannel(channel);
  };
}

/** What Realtime hands back on a row change. Named here because the
 *  client is untyped, so there is nothing for it to be inferred from. */
interface Change {
  new: PostRow;
  old: { id: string };
}

export interface RoomActivity {
  room: string;
  messages: number;
  voices: number;
  lastAt: string;
}

/**
 * How busy each room is, without loading any of it.
 *
 * What the challenge list uses to put "14 messages" beside a
 * challenge, and what tells a student which standing room is worth
 * opening today.
 */
export async function roomActivity(rooms?: string[]): Promise<Map<string, RoomActivity>> {
  const db = supabase();
  const out = new Map<string, RoomActivity>();

  if (!db) {
    for (const [room, a] of localActivity(rooms ?? []))
      out.set(room, { room, messages: a.messages, voices: a.voices, lastAt: a.lastAt });
    return out;
  }

  let q = db.from("room_activity").select("*");
  if (rooms?.length) q = q.in("room", rooms);

  const { data, error } = await q;
  if (error || !data) return out;
  for (const r of data as { room: string; messages: number; voices: number; last_at: string }[]) {
    out.set(r.room, { room: r.room, messages: r.messages, voices: r.voices, lastAt: r.last_at });
  }
  return out;
}

/**
 * The signed-in student's id, or the local stand-in.
 *
 * The room needs it to know which messages are the reader's own - what
 * can be edited, what is drawn on the right. One call so no component
 * has to know which of the two modes it is running in.
 */
export async function whoAmI(): Promise<string | null> {
  const db = supabase();
  if (!db) return LOCAL_ME;
  const { data } = await db.auth.getUser();
  return data.user?.id ?? null;
}
