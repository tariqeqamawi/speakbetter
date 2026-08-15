"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { chestClaimedToday, dailyQuests } from "@/lib/quests";
import { XP } from "@/lib/progress";
import { hapticCelebrate, playCelebration } from "@/lib/feedback-fx";
import {
  CheckIcon,
  CircleIcon,
  GiftIcon,
  TrophyIcon,
  ZapIcon,
} from "@/components/icons";

// Three slots and a chest. The chest opens itself the moment the third
// slot fills — earned rewards shouldn't need collecting — and the +XP
// lands with sound and motion, because a reward that arrives silently
// barely arrives at all.

export function DailyQuests() {
  const { state, ready, claimQuestChest } = useStore();
  const [justOpened, setJustOpened] = useState(false);
  const openedRef = useRef(false);

  const quests = ready ? dailyQuests(state) : [];
  const doneCount = quests.filter((q) => q.done).length;
  const allDone = quests.length > 0 && doneCount === quests.length;
  const claimed = ready && chestClaimedToday(state);

  useEffect(() => {
    if (!ready || !allDone || claimed || openedRef.current) return;
    openedRef.current = true;
    claimQuestChest();
    setJustOpened(true);
    playCelebration();
    hapticCelebrate();
    const t = setTimeout(() => setJustOpened(false), 3200);
    return () => clearTimeout(t);
  }, [ready, allDone, claimed, claimQuestChest]);

  if (!ready) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink">Today&apos;s quests</h2>
        <span className="text-xs tabular-nums text-ink-faint">
          {doneCount} of {quests.length}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {quests.map((quest) => (
          <li
            key={quest.id}
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              quest.done
                ? "border-mindset/40 bg-mindset/5"
                : "border-navy-700 bg-navy-900/40"
            }`}
          >
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                quest.done ? "bg-mindset/20 text-mindset" : "text-ink-faint"
              }`}
            >
              {quest.done ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CircleIcon className="size-4" />
              )}
            </span>
            <span className="flex flex-col">
              <span
                className={`text-sm font-medium ${quest.done ? "text-ink-muted line-through decoration-mindset/40" : "text-ink"}`}
              >
                {quest.label}
              </span>
              {!quest.done && (
                <span className="text-xs text-ink-faint">{quest.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* The chest: closed while the set is open, sprung once it's done.
          Claimed days show the receipt, not the prize — no re-earning. */}
      <div
        className={`flex items-center gap-3 rounded-lg border p-3 ${
          claimed
            ? "border-storytelling/40 bg-storytelling/5"
            : "border-dashed border-navy-600"
        }`}
      >
        <span
          className={`transition-transform duration-500 ${claimed ? "scale-110 text-storytelling" : "text-ink-faint"}`}
          aria-hidden
        >
          {claimed ? (
            <TrophyIcon className="size-6" />
          ) : (
            <GiftIcon className="size-6" />
          )}
        </span>
        {claimed ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-storytelling">
            Chest opened
            <span
              className={`flex items-center gap-1 rounded-full bg-storytelling/15 px-2 py-0.5 text-xs font-bold ${justOpened ? "xp-pop" : ""}`}
            >
              <ZapIcon className="size-3.5" />+{XP.dailyChest} XP
            </span>
          </span>
        ) : (
          <span className="text-sm text-ink-muted">
            Complete all three to open the chest —{" "}
            <b className="font-semibold text-ink">+{XP.dailyChest} XP</b>
          </span>
        )}
      </div>
    </section>
  );
}
