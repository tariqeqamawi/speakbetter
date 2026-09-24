"use client";

import { useEffect, useState } from "react";
import { Room } from "@/components/room";
import { ROOMS, roomActivity, type RoomId } from "@/lib/chat";
import { ChatIcon } from "@/components/icons";
import { SUPPORT_EMAIL } from "@/data/support";

// The three standing rooms, as tabs.
//
// WHY THREE AND NOT ONE. A single room in a cohort collapses into
// whoever posts most, and everybody else reads it as noise. Three
// named rooms each give somebody a reason to open one: the person
// stuck on a challenge, the person who just got a review they did not
// expect, and the person who only wants to say hello. Naming the
// reason is most of what makes somebody post at all.
//
// WHY TABS AND NOT THREE STACKED PANELS. A room is a conversation you
// are in, not a feed you scroll past. Stacked, all three would be half
// visible and none of them would feel like a place.

const COPY: Record<RoomId, { placeholder: string; empty: string }> = {
  challenges: {
    placeholder: "Which challenge are you on?",
    empty:
      "Stuck on one, or just got through one? This is where to say so. Somebody a week behind you will be glad you did.",
  },
  feedback: {
    placeholder: "What did Coach tell you?",
    empty:
      "What Coach said, what you changed, what you would tell somebody about to record. Nobody here has seen your video - only what you choose to say about it.",
  },
  general: {
    placeholder: "Say hello",
    empty: "Say hello, say where you are in the world, say why you are here. It starts with one person.",
  },
};

export function Rooms() {
  const [at, setAt] = useState<RoomId>("general");
  const [busy, setBusy] = useState<Map<string, { messages: number }>>(new Map());

  useEffect(() => {
    let alive = true;
    void (async () => {
      const got = await roomActivity(ROOMS.map((r) => r.id));
      if (alive) setBusy(got);
    })();
    return () => {
      alive = false;
    };
  }, [at]);

  const here = ROOMS.find((r) => r.id === at)!;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <ChatIcon className="size-6 shrink-0 text-storytelling" />
        <h2 className="text-xl font-bold tracking-tight text-ink">Chat rooms</h2>
      </div>

      {/* Which room. The count is the invitation - an empty room asked
          for is worse than an empty room stumbled into. */}
      <div role="tablist" aria-label="Rooms" className="flex gap-1.5 overflow-x-auto pb-1">
        {ROOMS.map((r) => {
          const on = r.id === at;
          const n = busy.get(r.id)?.messages ?? 0;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setAt(r.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                on
                  ? "border-storytelling bg-storytelling/15 text-storytelling"
                  : "border-navy-600 text-ink-faint hover:text-ink-muted"
              }`}
            >
              {r.name}
              {n > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${
                    on ? "bg-storytelling/25" : "bg-navy-700 text-ink-faint"
                  }`}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-ink-muted text-balance">{here.blurb}</p>

      <Room room={here.id} placeholder={COPY[at].placeholder} empty={COPY[at].empty} />

      {/* Not a room. A cohort chat always collects a few people with a
          billing question, and the kind thing is to say plainly where
          that goes before they post it to forty strangers. */}
      <p className="px-1 text-xs text-ink-faint text-balance">
        These rooms are for the cohort. Something wrong with your account, your payment or the app itself?
        Email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          {SUPPORT_EMAIL}
        </a>{" "}
        and a person will answer.
      </p>
    </section>
  );
}
