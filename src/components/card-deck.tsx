"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LessonCard, type LessonCardData } from "@/components/lesson-card";
import { CategoryIcon } from "@/components/category-icons";
import { categories, type CategoryId } from "@/data/categories";
import { rulesCard } from "@/data/deck";
import { hapticTap, playXpChime } from "@/lib/feedback-fx";
import { useStore } from "@/lib/store";
import { ChevronDownIcon, LockIcon, RepeatIcon } from "@/components/icons";

// The deck, worked the way a deck is worked.
//
// Two screens and one gesture each. The dial is the closed deck seen
// from above: seven face-down cards, one per color, worked with the same
// press-slide-release the skill dial uses - hold a thumb down, slide
// until the color you want lifts, let go. The reader is one card
// filling the screen, and a flick carries you to the next one in that
// color.
//
// Shaking the phone shuffles and pulls at random, which is the one thing
// a physical deck does that a list of links never will. It's also the
// honest answer to "I don't know what to work on today".

export interface DeckCard extends LessonCardData {
  vimeoId: string;
  categoryId: CategoryId;
}

type View =
  | { mode: "dial" }
  | { mode: "reader"; category: CategoryId; index: number };

/** How hard a shake has to be before it counts as one. */
const SHAKE_FORCE = 24;
const SHAKE_COOLDOWN = 900;

export function CardDeck({ cards }: { cards: DeckCard[] }) {
  const { state, ready } = useStore();
  const [view, setView] = useState<View>({ mode: "dial" });
  const [hovered, setHovered] = useState<CategoryId | null>(null);
  const [shakeOn, setShakeOn] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  const earned = (id: string) => !ready || state.watchedLessons.includes(id);
  const inSection = useCallback(
    (id: CategoryId) => cards.filter((c) => c.categoryId === id),
    [cards],
  );

  // ── Pull a card at random ──────────────────────────────────────────
  const pullRandom = useCallback(() => {
    const pool = cards.filter((c) => state.watchedLessons.includes(c.vimeoId));
    const from = pool.length ? pool : cards;
    const card = from[Math.floor(Math.random() * from.length)];
    const list = cards.filter((c) => c.categoryId === card.categoryId);
    setView({
      mode: "reader",
      category: card.categoryId,
      index: list.findIndex((c) => c.vimeoId === card.vimeoId),
    });
    hapticTap();
    playXpChime();
  }, [cards, state.watchedLessons]);

  // ── Shake to shuffle ───────────────────────────────────────────────
  // iOS requires permission, asked for on a tap; everywhere else the
  // listener just attaches. Either way there's a button doing the same
  // job, because a deck shouldn't be unusable on a laptop.
  useEffect(() => {
    if (!shakeOn) return;
    let last = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const force =
        Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      const now = Date.now();
      if (force > SHAKE_FORCE && now - last > SHAKE_COOLDOWN) {
        last = now;
        pullRandom();
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [shakeOn, pullRandom]);

  const enableShake = async () => {
    const api = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof api?.requestPermission === "function") {
      try {
        if ((await api.requestPermission()) !== "granted") return;
      } catch {
        return;
      }
    }
    setShakeOn(true);
  };

  // ── The dial: press, slide, release ────────────────────────────────
  useEffect(() => {
    if (view.mode !== "dial") return;
    const dial = dialRef.current;
    if (!dial) return;
    let dialing = false;

    const under = (t: Touch): CategoryId | null => {
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const node = el?.closest<HTMLElement>("[data-deck-node]");
      return (node?.dataset.deckNode as CategoryId) ?? null;
    };
    const onStart = (e: TouchEvent) => {
      const cat = under(e.touches[0]);
      if (!cat) return;
      dialing = true;
      setHovered(cat);
      e.preventDefault();
    };
    const onMove = (e: TouchEvent) => {
      if (!dialing) return;
      e.preventDefault();
      setHovered(under(e.touches[0]));
    };
    const onEnd = (e: TouchEvent) => {
      if (!dialing) return;
      dialing = false;
      e.preventDefault();
      const cat = under(e.changedTouches[0]);
      setHovered(null);
      if (cat) setView({ mode: "reader", category: cat, index: 0 });
    };
    const onCancel = () => {
      dialing = false;
      setHovered(null);
    };

    dial.addEventListener("touchstart", onStart, { passive: false });
    dial.addEventListener("touchmove", onMove, { passive: false });
    dial.addEventListener("touchend", onEnd, { passive: false });
    dial.addEventListener("touchcancel", onCancel);
    return () => {
      dial.removeEventListener("touchstart", onStart);
      dial.removeEventListener("touchmove", onMove);
      dial.removeEventListener("touchend", onEnd);
      dial.removeEventListener("touchcancel", onCancel);
    };
  }, [view.mode]);

  if (view.mode === "reader") {
    const list = inSection(view.category);
    return (
      <Reader
        cards={list}
        index={Math.min(view.index, list.length - 1)}
        earned={earned}
        onIndex={(index) => setView({ ...view, index })}
        onBack={() => setView({ mode: "dial" })}
        onShuffle={pullRandom}
      />
    );
  }

  const active = hovered ? categories.find((c) => c.id === hovered) : null;
  const activeCards = active ? inSection(active.id) : [];
  const activeEarned = activeCards.filter((c) =>
    ready ? state.watchedLessons.includes(c.vimeoId) : false,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* The deck, face down, one color per node */}
      <div
        ref={dialRef}
        className="relative mx-auto aspect-square w-full max-w-xl select-none touch-pan-y"
      >
        <div
          className={`absolute left-1/2 top-1/2 flex aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full border bg-navy-800/90 p-5 text-center transition-colors duration-300 ${
            active ? `border-current ${active.textClass}` : "border-navy-600"
          }`}
        >
          {active ? (
            <>
              <span
                className={`text-base font-semibold leading-tight ${active.textClass}`}
              >
                {active.name}
              </span>
              <span className="text-xs text-ink-muted">
                {activeCards.length} cards
                {activeEarned > 0 && ` · ${activeEarned} earned`}
              </span>
            </>
          ) : (
            <>
              <span className="text-base font-semibold text-ink">
                {cards.length} cards
              </span>
              <span className="text-xs text-ink-muted">
                Press a color and let go
              </span>
            </>
          )}
        </div>

        {categories.map((cat, i) => {
          const angle = (360 / categories.length) * i + 360 / categories.length / 2;
          const rad = ((angle - 90) * Math.PI) / 180;
          const x = 50 + 41 * Math.cos(rad);
          const y = 50 + 41 * Math.sin(rad);
          const lit = hovered === cat.id;
          const count = inSection(cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              data-deck-node={cat.id}
              aria-label={`${cat.name} - ${count} cards`}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(cat.id)}
              onBlur={() => setHovered(null)}
              onClick={() =>
                setView({ mode: "reader", category: cat.id, index: 0 })
              }
              // A face-down card rather than a dot: the thing you're
              // reaching for is a card, and it should look like one
              // before you pick it up.
              className={`absolute flex aspect-[89/127] w-[16%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg transition-all duration-300 ${
                lit
                  ? "z-10 scale-125 shadow-[0_0_26px_-4px_currentColor]"
                  : "shadow-[0_8px_18px_-10px_rgba(3,7,18,0.9)]"
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                background: `var(--color-${cat.id})`,
                color: `var(--color-${cat.id})`,
              }}
            >
              <CategoryIcon
                category={cat.id}
                className={`text-navy-950 transition-transform duration-300 ${lit ? "size-7" : "size-5"}`}
              />
            </button>
          );
        })}
      </div>

      {/* Shuffle, and the instruction card that explains the whole thing */}
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={shakeOn ? pullRandom : enableShake}
          className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-current"
        >
          <RepeatIcon className="size-4" />
          {shakeOn ? "Pull a card" : "Shuffle - or shake your phone"}
        </button>

        <details className="w-full max-w-md rounded-xl border border-navy-600 bg-navy-900/60">
          <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            How to use the deck
            <ChevronDownIcon className="size-4" />
          </summary>
          <ul className="flex flex-col gap-2.5 px-4 pb-4">
            {rulesCard.points.map((point) => (
              <li key={point} className="flex gap-2 text-xs text-ink-muted">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-faint" />
                {point}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

/** One card, filling the screen, with the section under your thumb. */
function Reader({
  cards,
  index,
  earned,
  onIndex,
  onBack,
  onShuffle,
}: {
  cards: DeckCard[];
  index: number;
  earned: (vimeoId: string) => boolean;
  onIndex: (index: number) => void;
  onBack: () => void;
  onShuffle: () => void;
}) {
  const card = cards[index];
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      // Flicking back off the first card leaves the section, which is
      // the gesture people already use to mean "out of here".
      if (next < 0) return onBack();
      if (next >= cards.length) return;
      hapticTap();
      onIndex(next);
    },
    [index, cards.length, onBack, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onBack]);

  if (!card) return null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronDownIcon className="size-4 rotate-90" />
          All colors
        </button>
        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: `var(--color-${card.categoryId})` }}
        >
          {card.category.code}
        </span>
        <button
          type="button"
          onClick={onShuffle}
          aria-label="Pull a card at random"
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <RepeatIcon className="size-4" />
          Shuffle
        </button>
      </div>

      {/* The card itself. A flick left brings the next one. */}
      <div
        className="w-full max-w-xs touch-pan-y"
        onTouchStart={(e) => {
          touch.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          // Horizontal enough to be a flick rather than a scroll.
          if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
          go(dx < 0 ? 1 : -1);
        }}
      >
        <LessonCard
          key={card.vimeoId}
          data={card}
          locked={!earned(card.vimeoId)}
          className="max-w-none"
        />
      </div>

      {!earned(card.vimeoId) && (
        <p className="flex items-center gap-1.5 text-xs text-ink-faint">
          <LockIcon className="size-3.5" />
          Watch the lesson and this card is yours
        </p>
      )}

      {/* Where you are in the color */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous card"
          className="rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-ink"
        >
          <ChevronDownIcon className="size-4 rotate-90" />
        </button>
        <span className="text-xs tabular-nums text-ink-faint">
          {index + 1} of {cards.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index >= cards.length - 1}
          aria-label="Next card"
          className="rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
        >
          <ChevronDownIcon className="size-4 -rotate-90" />
        </button>
      </div>

      <Link
        href={`/skills/${card.categoryId}/${card.vimeoId}`}
        className="text-xs font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        Watch this lesson
      </Link>
    </div>
  );
}
