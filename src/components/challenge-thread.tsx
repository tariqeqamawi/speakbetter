"use client";

import { useState } from "react";
import { Room } from "@/components/room";
import { challengeRoom } from "@/lib/chat";
import { ChatIcon, ChevronDownIcon } from "@/components/icons";

// What everybody else said about this challenge, on the challenge.
//
// THIS IS THE HALF THAT COMPOUNDS. A standing room in a six-week
// cohort is loud in week one and quiet by week three, because a room
// has no reason to exist at any particular moment. A thread attached
// to a challenge has the opposite shape: it is read by somebody
// standing on that exact challenge, about to record, looking for a
// reason to believe it is doable. And it ACCUMULATES - the next cohort
// arrives to find this one's advice already waiting, which is why
// these threads are deliberately not cohort-scoped.
//
// It is folded shut by default. Somebody who came here to record
// should see the brief and the record button first; the thread is for
// the moment they hesitate, which is exactly when a dozen people
// saying "mine was awful too" is worth more than anything the app can
// tell them itself.

export function ChallengeThread({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2.5 text-left"
      >
        <ChatIcon className="size-6 shrink-0 text-storytelling" />
        <span className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-ink">What others said about this one</span>
          {!open && (
            <span className="text-xs text-ink-faint">
              Everyone who has recorded it, and what they wish they had known
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={`ml-auto size-5 shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <Room
          room={challengeRoom(slug)}
          compact
          placeholder={`Say something about ${title}`}
          empty={`Nobody has said anything about ${title} yet. If you have recorded it - even badly - say so. That is the message somebody else needs.`}
        />
      )}
    </section>
  );
}
