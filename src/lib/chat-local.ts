"use client";

import { communityPosts } from "@/data/community-activity";

// The rooms, with no server behind them.
//
// WHY THIS EXISTS. The app's rule is that it works without Supabase -
// everything in the browser, one student per device (lib/supabase/
// config.ts). The chat has to keep that promise or it breaks the demo,
// the landing previews, and any local development done without keys.
//
// So this is the same four calls against localStorage. A student
// talking to themselves is not much of a community, but the SCREEN is
// real: the messages, the replies, the reactions, the composer and the
// empty state all behave exactly as they will with a server, which is
// the only way to know the room is right before the keys land.
//
// It also seeds a handful of messages so a first look at a room is not
// a blank rectangle - the same sample names the journey map already
// uses, so the fiction stays consistent across the app.

const KEY = "speak-better-chat-v1";
const STATE_KEY = "speak-better-state-v1";

export interface LocalPost {
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

type Book = Record<string, LocalPost[]>;

/** Everyone in this browser is the same person: the one using it. */
export const LOCAL_ME = "local-me";

function read(): Book {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Book;
  } catch {}
  return {};
}

function write(book: Book): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(book));
  } catch {}
}

/** What the student calls themselves, from the app's own record. */
function myName(): string {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as { displayName?: string; avatarUrl?: string };
      if (s.displayName) return s.displayName;
    }
  } catch {}
  return "You";
}

function myFace(): string | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return (JSON.parse(raw) as { avatarUrl?: string }).avatarUrl ?? null;
  } catch {}
  return null;
}

// ── Seeding ───────────────────────────────────────────────────────────
// Enough that a room reads as a conversation rather than a demo, and
// staggered backwards in time so the date separators have something to
// separate.

const SEEDS: Record<string, { name: string; body: string; hoursAgo: number }[]> = {
  general: [
    { name: "Maya", body: "Hello from Lisbon. Six weeks of talking to my phone, here we go.", hoursAgo: 52 },
    { name: "Jonas", body: "Berlin. I have avoided every presentation at work for four years. That is the whole reason I am here.", hoursAgo: 49 },
    { name: "Priya", body: "Manchester - I talk for a living and still go to pieces on camera. Funny how that works.", hoursAgo: 30 },
    { name: "Leo", body: "Just finished the tour. The lion telling me he reviews my uploads was not what I expected from a course app.", hoursAgo: 6 },
  ],
  challenges: [
    { name: "Amara", body: "The baseline is genuinely horrible and I recommend getting it over with tonight. Mine was 41 and I have stopped caring.", hoursAgo: 44 },
    { name: "Tomas", body: "Anyone else find the 30-second pitch harder than the two-minute story? Less room to hide.", hoursAgo: 20 },
    { name: "Lena", body: "Re-recorded Story Without Help four times. Take four was the one where I stopped performing it.", hoursAgo: 4 },
  ],
  feedback: [
    { name: "Ken", body: "Coach told me my hands were doing the talking and my face was doing nothing. Brutal and correct.", hoursAgo: 40 },
    { name: "Ines", body: "Got dinged for filler words I genuinely could not hear until I watched it back with the replay cues on.", hoursAgo: 26 },
    { name: "Ravi", body: "My structure colour finally lit up. Turns out I was telling the ending first the whole time.", hoursAgo: 3 },
  ],
};

/** A per-challenge thread's opening messages, generated so that every
 *  challenge has something rather than only the four that were typed. */
function seedFor(room: string): { name: string; body: string; hoursAgo: number }[] {
  if (SEEDS[room]) return SEEDS[room];
  if (!room.startsWith("challenge:")) return [];
  // Deterministic from the room name, so a challenge always gets the
  // same two people saying the same things - a thread that reshuffles
  // on reload reads as broken.
  const n = [...room].reduce((a, c) => a + c.charCodeAt(0), 0);
  const a = communityPosts[n % communityPosts.length];
  const b = communityPosts[(n * 7 + 3) % communityPosts.length];
  return [
    { name: a.name, body: a.text, hoursAgo: 28 },
    { name: b.name, body: b.text, hoursAgo: 9 },
  ];
}

function ensure(book: Book, room: string): LocalPost[] {
  if (book[room]) return book[room];
  const seeds = seedFor(room);
  book[room] = seeds.map((s, i) => ({
    id: `seed-${room}-${i}`,
    student_id: `seed-${s.name}`,
    room,
    cohort: null,
    body: s.body,
    at: new Date(Date.now() - s.hoursAgo * 3_600_000).toISOString(),
    edited_at: null,
    reply_to: null,
    pinned_at: null,
    author_name: s.name,
    author_avatar: null,
  }));
  return book[room];
}

// ── Telling the screen something changed ──────────────────────────────
// One emitter, because a room that does not update when you press send
// is not the room that ships.

type Listener = (room: string) => void;
const listeners = new Set<Listener>();

function announce(room: string): void {
  for (const fn of listeners) fn(room);
}

export function onLocalChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── The same four calls ───────────────────────────────────────────────

export function localRead(room: string): LocalPost[] {
  const book = read();
  const posts = ensure(book, room);
  write(book);
  return [...posts].sort((x, y) => x.at.localeCompare(y.at));
}

export function localSay(room: string, body: string, replyTo?: string): LocalPost {
  const book = read();
  const posts = ensure(book, room);

  // One level of replies, as the database enforces.
  let parent = replyTo ?? null;
  if (parent) {
    const p = posts.find((x) => x.id === parent);
    if (p?.reply_to) parent = p.reply_to;
  }

  const post: LocalPost = {
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    student_id: LOCAL_ME,
    room,
    cohort: null,
    body,
    at: new Date().toISOString(),
    edited_at: null,
    reply_to: parent,
    pinned_at: null,
    author_name: myName(),
    author_avatar: myFace(),
  };
  posts.push(post);
  write(book);
  announce(room);
  return post;
}

export function localReword(id: string, body: string): boolean {
  const book = read();
  for (const room of Object.keys(book)) {
    const post = book[room].find((p) => p.id === id);
    if (post) {
      post.body = body;
      post.edited_at = new Date().toISOString();
      write(book);
      announce(room);
      return true;
    }
  }
  return false;
}

export function localUnsay(id: string): boolean {
  const book = read();
  for (const room of Object.keys(book)) {
    const i = book[room].findIndex((p) => p.id === id);
    if (i >= 0) {
      book[room].splice(i, 1);
      write(book);
      announce(room);
      return true;
    }
  }
  return false;
}

// Reactions, kept beside the posts rather than in them so the shape
// matches the server's separate table.
const RKEY = "speak-better-chat-reactions-v1";
type Reactions = Record<string, string[]>; // postId -> kinds I have given

export function localReactions(): Reactions {
  try {
    const raw = localStorage.getItem(RKEY);
    if (raw) return JSON.parse(raw) as Reactions;
  } catch {}
  return {};
}

export function localReact(postId: string, kind: string, on: boolean): void {
  const all = localReactions();
  const mine = new Set(all[postId] ?? []);
  if (on) mine.add(kind);
  else mine.delete(kind);
  all[postId] = [...mine];
  try {
    localStorage.setItem(RKEY, JSON.stringify(all));
  } catch {}
  announce("*");
}

/** How busy each room is, for the counts beside a challenge. */
export function localActivity(rooms: string[]): Map<string, { messages: number; voices: number; lastAt: string }> {
  const book = read();
  const out = new Map<string, { messages: number; voices: number; lastAt: string }>();
  for (const room of rooms) {
    const posts = ensure(book, room);
    if (!posts.length) continue;
    out.set(room, {
      messages: posts.length,
      voices: new Set(posts.map((p) => p.student_id)).size,
      lastAt: posts.reduce((a, p) => (p.at > a ? p.at : a), posts[0].at),
    });
  }
  write(book);
  return out;
}
