"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  react,
  readRoom,
  reword,
  say,
  unsay,
  watchRoom,
  whoAmI,
  type Post,
  type ReactionKind,
} from "@/lib/chat";
import { localReactions } from "@/lib/chat-local";
import { Avatar } from "@/components/avatar";
import { ChatIcon, CheckIcon, SendIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";

// One room, used everywhere there are messages: the three standing
// rooms in Community, and the thread hanging off a challenge.
//
// WHAT THIS IS TRYING NOT TO BE. A chat in a course app is usually
// either a wall of grey bubbles nobody reads, or a Slack clone with
// eleven affordances. The shape here is deliberately closer to a
// comment thread than a chat: messages read top to bottom in the order
// they were said, replies tuck under their parent, and the composer
// sits still at the bottom rather than floating. Nothing auto-scrolls
// away from something somebody is reading.
//
// THE PART THAT MATTERS ON A CHALLENGE PAGE. This is read by somebody
// about to record - nervous, looking for a reason to believe it is
// doable. So the empty state invites rather than apologises, and other
// people's takes on the same challenge are the whole point.

const REACTIONS: { kind: ReactionKind; label: string; glyph: string }[] = [
  { kind: "cheer", label: "Cheer this", glyph: "👏" },
  { kind: "same", label: "Same here", glyph: "🙋" },
  { kind: "helpful", label: "This helped", glyph: "💡" },
];

/** "3m", "4h", "Tuesday" - the shortest true thing. */
function when(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** The day a message belongs to, for the separators. */
function dayOf(iso: string): string {
  return new Date(iso).toDateString();
}

function daySaid(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

export function Room({
  room,
  /** What the composer suggests, when the room is about one thing. */
  placeholder = "Say something",
  /** Shown when nobody has said anything yet. */
  empty = "Nobody has said anything here yet. Be the one who starts it.",
  /** A thread on a challenge is shorter than a standing room. */
  compact = false,
}: {
  room: string;
  placeholder?: string;
  empty?: string;
  compact?: boolean;
}) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Post | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [mine, setMine] = useState<Record<string, string[]>>({});
  const [failed, setFailed] = useState(false);

  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  // First load.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [rows, who] = await Promise.all([readRoom(room), whoAmI()]);
      if (!alive) return;
      setPosts(rows);
      setMe(who);
      setMine(localReactions());
    })();
    return () => {
      alive = false;
    };
  }, [room]);

  // And everything said after that. The row arrives complete, so a new
  // message is drawn without asking the server anything else.
  useEffect(() => {
    return watchRoom(room, {
      said: (p) => setPosts((old) => (old?.some((x) => x.id === p.id) ? old : [...(old ?? []), p])),
      changed: (p) => setPosts((old) => old?.map((x) => (x.id === p.id ? p : x)) ?? null),
      gone: (id) => setPosts((old) => old?.filter((x) => x.id !== id) ?? null),
    });
  }, [room]);

  // Keep the newest message in view - but only when the reader was
  // already at the bottom. Yanking somebody away from a message they
  // are halfway through reading is the single rudest thing a chat can
  // do, and it is the default everywhere.
  const wasAtBottom = useRef(true);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !posts) return;
    if (wasAtBottom.current) el.scrollTop = el.scrollHeight;
  }, [posts]);

  const onScroll = () => {
    const el = box.current;
    if (!el) return;
    wasAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setFailed(false);

    if (editing) {
      const ok = await reword(editing.id, text);
      if (ok) {
        setPosts((old) =>
          old?.map((x) => (x.id === editing.id ? { ...x, body: text, editedAt: new Date().toISOString() } : x)) ?? null,
        );
        setEditing(null);
        setDraft("");
      } else setFailed(true);
      setSending(false);
      return;
    }

    const saved = await say(room, text, { replyTo: replyTo?.id });
    if (saved) {
      // The local transport announces its own writes, so guard against
      // adding the same message twice.
      setPosts((old) => (old?.some((x) => x.id === saved.id) ? old : [...(old ?? []), saved]));
      setDraft("");
      setReplyTo(null);
      wasAtBottom.current = true;
      hapticTap();
    } else {
      setFailed(true);
    }
    setSending(false);
  }, [draft, sending, editing, room, replyTo]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, shift-enter makes a line. What everybody expects.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
    if (e.key === "Escape") {
      setReplyTo(null);
      setEditing(null);
      setDraft("");
    }
  };

  const toggle = async (post: Post, kind: ReactionKind) => {
    const have = (mine[post.id] ?? []).includes(kind);
    setMine((old) => {
      const set = new Set(old[post.id] ?? []);
      if (have) set.delete(kind);
      else set.add(kind);
      return { ...old, [post.id]: [...set] };
    });
    hapticTap();
    await react(post.id, kind, !have);
  };

  const remove = async (post: Post) => {
    setPosts((old) => old?.filter((x) => x.id !== post.id) ?? null);
    await unsay(post.id);
  };

  const startEdit = (post: Post) => {
    setEditing(post);
    setReplyTo(null);
    setDraft(post.body);
    field.current?.focus();
  };

  // Replies live under their parent rather than in the flow, so a
  // thread reads as an exchange instead of a scramble.
  const top = (posts ?? []).filter((p) => !p.replyTo);
  const repliesTo = (id: string) => (posts ?? []).filter((p) => p.replyTo === id);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <div
        ref={box}
        onScroll={onScroll}
        className={`flex flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-3 ${
          compact ? "max-h-[26rem]" : "max-h-[34rem] min-h-[18rem]"
        }`}
      >
        {posts === null ? (
          <p className="py-8 text-center text-sm text-ink-faint">Opening the room…</p>
        ) : top.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ChatIcon className="size-7 text-ink-faint" />
            <p className="max-w-xs text-sm text-ink-muted text-balance">{empty}</p>
          </div>
        ) : (
          top.map((post, i) => {
            const prev = top[i - 1];
            const newDay = !prev || dayOf(prev.at) !== dayOf(post.at);
            return (
              <div key={post.id} className="flex flex-col">
                {newDay && (
                  <div className="flex items-center gap-3 py-3">
                    <span className="h-px flex-1 bg-navy-700" />
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
                      {daySaid(post.at)}
                    </span>
                    <span className="h-px flex-1 bg-navy-700" />
                  </div>
                )}
                <Message
                  post={post}
                  me={me}
                  mine={mine[post.id] ?? []}
                  onReply={() => {
                    setReplyTo(post);
                    setEditing(null);
                    field.current?.focus();
                  }}
                  onReact={(k) => toggle(post, k)}
                  onEdit={() => startEdit(post)}
                  onDelete={() => remove(post)}
                />
                {repliesTo(post.id).length > 0 && (
                  <div className="ml-6 flex flex-col gap-1 border-l border-navy-700 pl-3">
                    {repliesTo(post.id).map((r) => (
                      <Message
                        key={r.id}
                        post={r}
                        me={me}
                        mine={mine[r.id] ?? []}
                        reply
                        onReply={() => {
                          setReplyTo(post);
                          setEditing(null);
                          field.current?.focus();
                        }}
                        onReact={(k) => toggle(r, k)}
                        onEdit={() => startEdit(r)}
                        onDelete={() => remove(r)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* The composer. Stays put; never floats over what is being read. */}
      <div className="flex flex-col gap-2 border-t border-navy-700 bg-navy-850 px-3 py-2.5">
        {(replyTo || editing) && (
          <div className="flex items-center gap-2 rounded-lg bg-navy-900 px-3 py-1.5 text-xs">
            <span className="text-ink-faint">
              {editing ? "Editing your message" : `Replying to ${replyTo?.authorName}`}
            </span>
            <span className="min-w-0 flex-1 truncate text-ink-muted">
              {(editing ?? replyTo)?.body}
            </span>
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setEditing(null);
                if (editing) setDraft("");
              }}
              aria-label="Stop"
              className="shrink-0 text-ink-faint transition-colors hover:text-ink"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={field}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            maxLength={2000}
            placeholder={placeholder}
            aria-label={placeholder}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-mindset focus:outline-none"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label={editing ? "Save" : "Send"}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-mindset text-navy-950 transition-transform hover:scale-105 active:scale-95 disabled:opacity-35 disabled:hover:scale-100"
          >
            {editing ? <CheckIcon className="size-5" /> : <SendIcon className="size-5" />}
          </button>
        </div>

        {failed && (
          <p className="px-1 text-xs text-acting">
            That didn&apos;t send. Your words are still in the box - try again in a moment.
          </p>
        )}
      </div>
    </div>
  );
}

function Message({
  post,
  me,
  mine,
  reply = false,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: {
  post: Post;
  me: string | null;
  mine: string[];
  reply?: boolean;
  onReply: () => void;
  onReact: (k: ReactionKind) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isMine = me !== null && post.studentId === me;
  const [open, setOpen] = useState(false);

  return (
    <div
      className="group flex gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-navy-900/60"
      onMouseLeave={() => setOpen(false)}
    >
      <Avatar name={post.authorName} src={post.authorAvatar ?? undefined} className={reply ? "size-7" : "size-9"} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className={`text-sm font-semibold ${isMine ? "text-mindset" : "text-ink"}`}>
            {isMine ? "You" : post.authorName}
          </span>
          {post.pinnedAt && (
            <span className="rounded-full bg-figurative/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-figurative">
              Pinned
            </span>
          )}
          <span className="text-xs text-ink-faint">{when(post.at)}</span>
          {post.editedAt && <span className="text-xs text-ink-faint">· edited</span>}
        </span>

        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-muted">{post.body}</p>

        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          {REACTIONS.map(({ kind, label, glyph }) => {
            const on = mine.includes(kind);
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onReact(kind)}
                aria-label={label}
                aria-pressed={on}
                title={label}
                className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  on
                    ? "border-mindset/60 bg-mindset/15 text-mindset"
                    : "border-transparent text-ink-faint opacity-0 hover:border-navy-600 hover:text-ink-muted focus-visible:opacity-100 group-hover:opacity-100"
                }`}
              >
                {glyph}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onReply}
            className="rounded-full px-2 py-0.5 text-xs text-ink-faint opacity-0 transition-colors hover:text-ink-muted focus-visible:opacity-100 group-hover:opacity-100"
          >
            Reply
          </button>

          {isMine && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full px-2 py-0.5 text-xs text-ink-faint opacity-0 transition-colors hover:text-ink-muted focus-visible:opacity-100 group-hover:opacity-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => (open ? onDelete() : setOpen(true))}
                className={`rounded-full px-2 py-0.5 text-xs transition-colors focus-visible:opacity-100 group-hover:opacity-100 ${
                  open ? "bg-acting/15 text-acting opacity-100" : "text-ink-faint opacity-0 hover:text-acting"
                }`}
              >
                {open ? "Really delete?" : "Delete"}
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
