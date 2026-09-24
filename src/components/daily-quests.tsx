"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { chestClaimedToday, dailyQuests } from "@/lib/quests";
import { MapIcon } from "@/components/icons";
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
// slot fills - earned rewards shouldn't need collecting - and the +XP
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-ink">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-structure/15 text-structure">
            <MapIcon className="size-5" />
          </span>
          Today&apos;s quests
        </h2>
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
          Claimed days show the receipt, not the prize - no re-earning. */}
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
          /* Drawn as the prize it is.
             
             It was grey body text beside a grey icon, sitting under
             three quests that are themselves grey until they are done
             - so the one line on the card that says what the work is
             WORTH looked like a footnote. Gold, because gold is what
             a chest is, and because nothing else on Today is gold:
             the eye finds it without being told where to look.
             
             Not a <button>. There is nothing to press - the chest
             opens itself the moment the third quest lands. It is
             shaped like a prize, not like a control. */
          <span className="chest-prize flex flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-bold text-navy-950">
            Complete all three to open the chest
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-navy-950/20 px-2 py-0.5 text-xs font-black">
              <ZapIcon className="size-3.5" />+{XP.dailyChest} XP
            </span>
          </span>
        )}
      </div>
    </section>
  );
}
