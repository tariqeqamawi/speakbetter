"use client";

import { RoaringLion } from "@/components/roaring-lion";


import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LessonCard, CardFaceDown } from "@/components/lesson-card";
import { CategoryIcon } from "@/components/category-icons";
import { categories, type Category, type CategoryId } from "@/data/categories";
import { rulesCard, type DeckCardData } from "@/data/deck";
import { hapticTap, playXpChime } from "@/lib/feedback-fx";
import {
  ChevronDownIcon,
  DeckIcon,
  ExpandIcon,
  RepeatIcon,
  XIcon,
} from "@/components/icons";

// The deck, worked the way a deck is worked.
//
// Three surfaces, each one gesture:
//
//   THE DIAL     the closed deck seen from above - seven face-down
//                cards, one per color, worked with the same
//                press-slide-release the skill dial uses. Hold a thumb
//                down, slide until the color you want lifts, let go.
//
//   THE COLOR    that color fanned into a stacked carousel: the card in
//                front is face up and readable, the rest of the color
//                stacks away behind it on both sides. Swipe, drag or
//                arrow through them and take the one you want. The seven
//                colors sit along the bottom, so moving to another
//                section never means going back out first.
//
//   THE SPREAD   one card pulled at random from every color at once -
//                seven ingredients for one talk, which is what the deck
//                is for. Deal it again and you have a different talk.
//
// Any card opens full size from any of them, because a card that can't
// be read at arm's length isn't doing its job on a phone.
//
// Shaking the phone shuffles and pulls at random, which is the one thing
// a physical deck does that a list of links never will. It's also the
// honest answer to "I don't know what to work on today".

/** A card as the deck deals it - see cardFor() in data/deck.ts. */
export type DeckCard = DeckCardData;

type View =
  | { mode: "dial" }
  | { mode: "color"; category: CategoryId; index: number }
  | { mode: "spread" };

/** A card opened full size, and the cards it sits among. */
type Zoom = { list: DeckCard[]; index: number };

/** How hard a shake has to be before it counts as one. */
const SHAKE_FORCE = 24;

/** The spread's fan: a card's width as a share of the fan's, and how far
    along the next card sits, as a share of a card's width. */
const FAN_CARD = 0.26;
const FAN_STEP = 0.4;
const SHAKE_COOLDOWN = 900;

/** One card taken at random from a list. */
function anyOf(cards: DeckCard[]): DeckCard {
  return cards[Math.floor(Math.random() * cards.length)];
}

export function CardDeck({ cards }: { cards: DeckCard[] }) {
  const [view, setView] = useState<View>({ mode: "dial" });
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const [hovered, setHovered] = useState<CategoryId | null>(null);
  const [shakeOn, setShakeOn] = useState(false);
  // The dealt spread, kept while the student walks away into a color and
  // comes back - a hand you have to re-deal to look at twice is a hand
  // you can't think with.
  const [hand, setHand] = useState<DeckCard[] | null>(null);
  const dialRef = useRef<HTMLDivElement>(null);

  const inSection = useCallback(
    (id: CategoryId) => cards.filter((c) => c.categoryId === id),
    [cards],
  );

  const openColor = useCallback((category: CategoryId, index = 0) => {
    hapticTap();
    setView({ mode: "color", category, index });
  }, []);

  // ── Pull a card at random ──────────────────────────────────────────
  const pullRandom = useCallback(() => {
    const card = anyOf(cards);
    const list = cards.filter((c) => c.categoryId === card.categoryId);
    setView({
      mode: "color",
      category: card.categoryId,
      index: list.findIndex((c) => c.vimeoId === card.vimeoId),
    });
    hapticTap();
    playXpChime();
  }, [cards]);

  // ── Deal a full spread: one card of every color ────────────────────
  const deal = useCallback(() => {
    const dealt = categories
      .map((cat) => cards.filter((c) => c.categoryId === cat.id))
      .filter((list) => list.length)
      .map(anyOf);
    setHand(dealt);
    setView({ mode: "spread" });
    hapticTap();
    playXpChime();
  }, [cards]);

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
      if (cat) openColor(cat);
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
  }, [view.mode, openColor]);

  // The card opened full size sits over whichever surface called it.
  // Opened from the spread it carries the whole hand along as a strip,
  // so the seven are a swipe or a tap apart rather than a trip back out.
  const overlay = zoom && (
    <CardZoom
      card={zoom.list[zoom.index]}
      hand={zoom.list === hand ? hand : undefined}
      index={zoom.index}
      hasPrev={zoom.index > 0}
      hasNext={zoom.index < zoom.list.length - 1}
      position={`${zoom.index + 1} of ${zoom.list.length}`}
      onStep={(delta) =>
        setZoom((z) =>
          z && z.list[z.index + delta] ? { ...z, index: z.index + delta } : z,
        )
      }
      onJump={(index) => setZoom((z) => (z ? { ...z, index } : z))}
      onClose={() => setZoom(null)}
    />
  );

  if (view.mode === "color") {
    const list = inSection(view.category);
    const section = categories.find((c) => c.id === view.category)!;
    return (
      <>
        <ColorCarousel
          cards={list}
          section={section}
          index={Math.min(view.index, list.length - 1)}
          onIndex={(index) => setView({ ...view, index })}
          onSection={(id) => openColor(id)}
          onZoom={(index) => setZoom({ list, index })}
          onBack={() => setView({ mode: "dial" })}
          countIn={(id) => inSection(id).length}
        />
        {overlay}
      </>
    );
  }

  if (view.mode === "spread" && hand) {
    return (
      <>
        <FullSpread
          hand={hand}
          onZoom={(index) => setZoom({ list: hand, index })}
          onDeal={deal}
          onBack={() => setView({ mode: "dial" })}
        />
        {overlay}
      </>
    );
  }

  const active = hovered ? categories.find((c) => c.id === hovered) : null;
  const activeCards = active ? inSection(active.id) : [];

  return (
    <div className="flex flex-col gap-4">
      {/* The color under the thumb, named above the deck in its color -
          the hub keeps its shape, as the skill dial's does. */}
      <div className="flex h-12 flex-col items-center justify-center text-center" aria-live="polite">
        {active ? (
          <>
            <span className={`text-lg font-semibold leading-tight ${active.textClass}`}>{active.short}</span>
            <span className="text-xs text-ink-muted">{activeCards.length} cards</span>
          </>
        ) : (
          <>
            <span className="text-lg font-semibold text-ink">{cards.length} cards</span>
            <span className="text-xs text-ink-muted">Press a color and let go</span>
          </>
        )}
      </div>

      {/* The deck, face down, one color per node */}
      <div
        ref={dialRef}
        className="relative mx-auto aspect-square w-full max-w-xl select-none touch-pan-y"
      >
        <div
          className={`absolute left-1/2 top-1/2 flex aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border bg-navy-800/90 transition-[border-color,box-shadow,color] duration-300 ${
            active
              ? `border-current ${active.textClass} shadow-[0_0_36px_-6px_currentColor]`
              : "border-navy-600"
          }`}
        >
          <RoaringLion className="w-[92%] translate-y-[4%]" />
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
              onClick={() => openColor(cat.id)}
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

      {/* The two ways in that aren't a color, and the instruction card */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={deal}
            className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-current"
          >
            <DeckIcon className="size-4" />
            Deal a full spread
          </button>
          <button
            type="button"
            onClick={shakeOn ? pullRandom : enableShake}
            className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-current"
          >
            <RepeatIcon className="size-4" />
            {shakeOn ? "Pull a card" : "Shuffle - or shake your phone"}
          </button>
        </div>
        {hand && (
          <button
            type="button"
            onClick={() => setView({ mode: "spread" })}
            className="text-xs font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Back to the spread you dealt
          </button>
        )}

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

/** The seven colors as a strip, for moving between them without going out. */
function ColorStrip({
  active,
  onPick,
  countIn,
}: {
  active: CategoryId;
  onPick: (id: CategoryId) => void;
  countIn: (id: CategoryId) => number;
}) {
  return (
    <div className="flex items-end justify-center gap-1.5">
      {categories.map((cat) => {
        const on = cat.id === active;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => !on && onPick(cat.id)}
            aria-current={on}
            aria-label={`${cat.name} - ${countIn(cat.id)} cards`}
            title={cat.name}
            className={`flex aspect-[89/127] w-9 items-center justify-center rounded-md transition-all duration-200 sm:w-11 ${
              on
                ? "-translate-y-1 shadow-[0_0_18px_-3px_currentColor]"
                : "opacity-45 hover:opacity-100"
            }`}
            style={{
              background: `var(--color-${cat.id})`,
              color: `var(--color-${cat.id})`,
            }}
          >
            <CategoryIcon
              category={cat.id}
              className={`text-navy-950 ${on ? "size-4" : "size-3.5"}`}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * One color as a stacked carousel.
 *
 * Picking a color used to drop you on its first card and leave you
 * paging forward in the order the course teaches them, which is the one
 * way a deck is never used. This is the color spread in the hand: the
 * card in front is face up and readable, the rest of the color stacks
 * away behind it to either side, and you swipe until you reach the one
 * you want. Nothing has to be walked past to get anywhere.
 *
 * The cards behind stay face down. A stack of readable faces is a list
 * with extra steps - what the fan is for is seeing how much color you're
 * choosing from, and the depth of a color is the argument for pulling
 * from it.
 */
function ColorCarousel({
  cards,
  section,
  index,
  onIndex,
  onSection,
  onZoom,
  onBack,
  countIn,
}: {
  cards: DeckCard[];
  section: Category;
  index: number;
  onIndex: (index: number) => void;
  onSection: (id: CategoryId) => void;
  onZoom: (index: number) => void;
  onBack: () => void;
  countIn: (id: CategoryId) => number;
}) {
  const color = `var(--color-${section.id})`;
  const card = cards[index];
  // How far a card can be from the front and still be worth drawing.
  // Three and no further: the fan has to stay inside the width of a
  // phone, and a card sliced off by the edge of the screen reads as a
  // layout fault rather than as a deck going on.
  const DEPTH = 3;

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0 || next >= cards.length) return;
      hapticTap();
      onIndex(next);
    },
    [index, cards.length, onIndex],
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

  // Drag the fan with a finger or a mouse. A drag that moved the stack
  // swallows the click that follows it, so letting go on top of a card
  // doesn't also open the card you were only dragging past.
  const drag = useRef<number | null>(null);
  const dragged = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = e.clientX;
    dragged.current = false;
    // Hold the pointer: on a phone the thumb wanders over the cards
    // (each a button) and off the fan, and without capture the moves
    // stop arriving here the moment it does.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current === null) return;
    const dx = e.clientX - drag.current;
    if (Math.abs(dx) < 36) return;
    drag.current = e.clientX;
    dragged.current = true;
    go(dx < 0 ? 1 : -1);
  };
  const endDrag = (e: React.PointerEvent) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  if (!card) return null;

  return (
    <div className="flex flex-col items-center gap-4">
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
          style={{ color }}
        >
          {section.code}
        </span>
        <button
          type="button"
          onClick={() => {
            playXpChime();
            onIndex(Math.floor(Math.random() * cards.length));
          }}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <RepeatIcon className="size-4" />
          Any card
        </button>
      </div>

      {/* The fan. The front card is the one you're choosing; the rest of
          the color stacks away behind it on both sides.

          On a laptop the fan opens wider and the cards grow with it: a
          card sized for a thumb is a postage stamp beside a keyboard,
          and the text on it - about 3% of its own width - is what the
          card is for. */}
      <div
        className="relative mx-auto flex aspect-[5/4] w-full max-w-lg touch-pan-y select-none items-center justify-center lg:max-w-3xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {cards.map((c, i) => {
          const d = i - index;
          if (Math.abs(d) > DEPTH) return null;
          const near = Math.min(Math.abs(d), DEPTH);
          const front = d === 0;
          return (
            <span
              key={c.vimeoId}
              className="deck-stack-card absolute w-[44%] max-w-[14rem] lg:max-w-[21rem]"
              style={{
                zIndex: 20 - near,
                opacity: 1 - near * 0.16,
                transform: `translateX(${d * 24}%) rotate(${d * 6}deg) scale(${1 - near * 0.08})`,
              }}
            >
              {front ? (
                // Under a mouse the front card swells while the pointer
                // is on it - see .deck-front-card. Reading it shouldn't
                // cost a click; the click is for opening it big.
                <span className="deck-front-card block">
                  <LessonCard
                    key={c.vimeoId}
                    data={c}
                    startFlipped
                    onActivate={() => {
                      if (!dragged.current) onZoom(i);
                    }}
                    className="max-w-none"
                  />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (dragged.current) return;
                    hapticTap();
                    onIndex(i);
                  }}
                  aria-label={`Card ${i + 1} of ${cards.length}`}
                  className="card-3d relative block aspect-[89/127] w-full"
                >
                  <CardFaceDown
                    section={section.name}
                    code={section.code}
                    color={color}
                  />
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Where you are in the color, and the way to read the card big */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous card"
          className="rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
        >
          <ChevronDownIcon className="size-4 rotate-90" />
        </button>
        <button
          type="button"
          onClick={() => onZoom(index)}
          className="flex items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-current"
        >
          <ExpandIcon className="size-4" />
          Open the card
        </button>
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

      <p className="text-center text-xs text-ink-faint">
        <span className="tabular-nums">
          {index + 1} of {cards.length}
        </span>
        {" · "}
        {section.name}
      </p>

      <ColorStrip active={section.id} onPick={onSection} countIn={countIn} />
    </div>
  );
}

/**
 * The full spread: one card pulled at random from every color.
 *
 * This is the deck's whole argument in one gesture. Seven cards on the
 * table are the ingredients for a talk that moves - a story, the
 * language to paint it, a way to perform it, a shape, a mindset, a body,
 * a finish - and no two deals hand you the same talk. Random on purpose:
 * a hand you chose is a hand of what you already do.
 *
 * Drawn as a hand: seven cards fanned over each other, the way you'd
 * hold them, in the order the colors run. Face up, because a spread is
 * dealt to be looked at - and under a mouse a card lifts out of the fan
 * and comes forward while the pointer is on it, so it can be read where
 * it lies. Any card opens full size with a tap. The seven lessons are
 * named under the fan, because the fan shows you the colors and the
 * titles are what make a card an ingredient you can plan with; hovering
 * a name lifts its card.
 */
function FullSpread({
  hand,
  onZoom,
  onDeal,
  onBack,
}: {
  hand: DeckCard[];
  onZoom: (index: number) => void;
  onDeal: () => void;
  onBack: () => void;
}) {
  // The card lifted out of the fan: the one under the pointer, or the
  // one whose name is pointed at below.
  const [raised, setRaised] = useState<number | null>(null);
  const mid = (hand.length - 1) / 2;
  const fanRef = useRef<HTMLDivElement>(null);

  // Which card a point across the fan belongs to. Worked out from where
  // the cards are laid rather than from what's under the pointer,
  // because the lifted card grows over its neighbours' edges: read off
  // the screen, sliding right from a lifted card would skip the one
  // beside it. Each card owns the strip of itself the next one leaves
  // showing; the last owns all of itself.
  const indexAt = useCallback(
    (clientX: number): number | null => {
      const fan = fanRef.current;
      if (!fan) return null;
      const box = fan.getBoundingClientRect();
      const w = box.width * FAN_CARD;
      const step = w * FAN_STEP;
      const first = box.width / 2 - mid * step - w / 2;
      const i = Math.floor((clientX - box.left - first) / step);
      return Math.max(0, Math.min(hand.length - 1, i));
    },
    [hand.length, mid],
  );

  // Press, slide, release - the same gesture as the dial. A finger down
  // on the fan lifts the card under it, sliding moves the lift with it,
  // and letting go opens the card that's up. On a phone the cards
  // overlap to a sliver each, and a sliver is a poor thing to have to
  // hit; this way any touch on the fan lands on a card, and the card
  // shows itself before the finger commits.
  useEffect(() => {
    const fan = fanRef.current;
    if (!fan) return;
    let pressing = false;
    let last: number | null = null;
    const onStart = (e: TouchEvent) => {
      pressing = true;
      last = indexAt(e.touches[0].clientX);
      setRaised(last);
      e.preventDefault();
    };
    const onMove = (e: TouchEvent) => {
      if (!pressing) return;
      e.preventDefault();
      const i = indexAt(e.touches[0].clientX);
      if (i !== last) {
        last = i;
        hapticTap();
        setRaised(i);
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (!pressing) return;
      pressing = false;
      e.preventDefault();
      const i = indexAt(e.changedTouches[0].clientX);
      setRaised(null);
      if (i !== null) onZoom(i);
    };
    const onCancel = () => {
      pressing = false;
      setRaised(null);
    };
    fan.addEventListener("touchstart", onStart, { passive: false });
    fan.addEventListener("touchmove", onMove, { passive: false });
    fan.addEventListener("touchend", onEnd, { passive: false });
    fan.addEventListener("touchcancel", onCancel);
    return () => {
      fan.removeEventListener("touchstart", onStart);
      fan.removeEventListener("touchmove", onMove);
      fan.removeEventListener("touchend", onEnd);
      fan.removeEventListener("touchcancel", onCancel);
    };
  }, [indexAt, onZoom]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronDownIcon className="size-4 rotate-90" />
          All colors
        </button>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
          The spread
        </span>
        <button
          type="button"
          onClick={onDeal}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <RepeatIcon className="size-4" />
          Deal again
        </button>
      </div>

      <p className="text-center text-sm text-ink-muted text-balance">
        One card of every color - the ingredients for a talk that moves.
        Tap any card to read it.
      </p>

      {/* The fan. Each card is placed by its distance from the middle
          one: stepped sideways, turned a little further, and dropped
          along the arc a hand makes. The transform lives in a custom
          property so the lift (see .fan-card) can add to it rather than
          replace it. The box is tall enough for the outer cards'
          corners and a lifted card.

          Under a mouse the card under the pointer lifts and a click
          opens it; the cards themselves don't take the pointer, so the
          fan decides which card is meant (see indexAt) and a click
          can't land on a different card than the one that's up. They
          still take the keyboard - each is a button, and Enter on a
          focused one opens it. */}
      <div
        ref={fanRef}
        className="relative mx-auto aspect-[2/1] w-full max-w-4xl cursor-pointer touch-none select-none"
        onMouseMove={(e) => setRaised(indexAt(e.clientX))}
        onMouseLeave={() => setRaised(null)}
        onClick={(e) => {
          const i = indexAt(e.clientX);
          if (i === null) return;
          hapticTap();
          onZoom(i);
        }}
      >
        {hand.map((card, i) => {
          const d = i - mid;
          return (
            <span
              key={card.vimeoId}
              className={`fan-card absolute left-1/2 top-[6%] ${
                raised === i ? "is-raised" : ""
              }`}
              style={
                {
                  width: `${FAN_CARD * 100}%`,
                  zIndex: 10 + i,
                  "--fan": `translateX(${d * FAN_STEP * 100}%) rotate(${d * 6}deg) translateY(${d * d * 2.2}%)`,
                } as React.CSSProperties
              }
            >
              <LessonCard
                key={card.vimeoId}
                data={card}
                startFlipped
                onActivate={() => {
                  hapticTap();
                  onZoom(i);
                }}
                className="pointer-events-none max-w-none"
              />
            </span>
          );
        })}
      </div>

      {/* The hand, named. */}
      <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-1.5">
        {hand.map((card, i) => (
          <li key={card.vimeoId}>
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onZoom(i);
              }}
              onMouseEnter={() => setRaised(i)}
              onMouseLeave={() => setRaised(null)}
              onFocus={() => setRaised(i)}
              onBlur={() => setRaised(null)}
              className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs font-medium text-ink-muted transition-colors hover:text-ink sm:text-[0.8rem]"
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: `var(--color-${card.categoryId})` }}
              />
              {card.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A card at arm's length.
 *
 * The card carries three blocks of text at about 3% of its own width,
 * which is legible on an 89mm card in the hand and marginal on a phone
 * inside a carousel. So any card opens to the height of the screen -
 * as tall as the viewport allows once the controls under it have their
 * room, and never wider than the screen, so it's whole in either
 * orientation rather than cropped tall - and a tap still turns it over,
 * because a card you can't turn over is a picture of a card. There is
 * no cap in rems: on a laptop this is the full-screen view, and a card
 * that stops growing at phone size on a 27-inch monitor isn't one.
 */
function CardZoom({
  card,
  hand,
  index,
  hasPrev,
  hasNext,
  position,
  onStep,
  onJump,
  onClose,
}: {
  card: DeckCard;
  /** The dealt spread this card was opened from, if it was. */
  hand?: DeckCard[];
  index: number;
  hasPrev: boolean;
  hasNext: boolean;
  position: string;
  onStep: (delta: number) => void;
  onJump: (index: number) => void;
  onClose: () => void;
}) {
  // Escape closes it, the arrows walk it, and the page underneath holds
  // still while it's up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onStep(-1);
      if (e.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onStep]);

  const touch = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close the card"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${card.title} - card`}
        className="panel-in relative flex flex-col items-center gap-4"
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
          onStep(dx < 0 ? 1 : -1);
        }}
      >
        <div className="card-zoom">
          <LessonCard
            key={card.vimeoId}
            data={card}
            startFlipped
            className="max-w-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onStep(-1)}
            disabled={!hasPrev}
            aria-label="Previous card"
            className="flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronDownIcon className="size-5 rotate-90" />
          </button>

          {hand ? (
            // The hand, as a strip: one small back per card in its
            // color, the open one standing up. A tap goes straight to
            // it - seven cards should be seven taps apart at most, not
            // six presses of the same arrow.
            <div
              className="flex items-end gap-1.5"
              role="tablist"
              aria-label="The spread"
            >
              {hand.map((c, i) => {
                const on = i === index;
                return (
                  <button
                    key={c.vimeoId}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-label={c.title}
                    onClick={() => {
                      if (!on) hapticTap();
                      onJump(i);
                    }}
                    className={`aspect-[89/127] w-6 rounded-[3px] transition-all duration-200 sm:w-7 ${
                      on
                        ? "-translate-y-1 shadow-[0_0_14px_-2px_currentColor]"
                        : "opacity-45 hover:opacity-80"
                    }`}
                    style={{
                      background: `var(--color-${c.categoryId})`,
                      color: `var(--color-${c.categoryId})`,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <span className="min-w-12 text-center text-xs tabular-nums text-ink-faint">
              {position}
            </span>
          )}

          <button
            type="button"
            onClick={() => onStep(1)}
            disabled={!hasNext}
            aria-label="Next card"
            className="flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronDownIcon className="size-5 -rotate-90" />
          </button>
        </div>

        <p className="text-center text-xs text-ink-faint">
          {hand ? `${position} · ` : ""}
          Tap the card to turn it over
          {" · "}
          <Link
            href={`/skills/${card.categoryId}/${card.vimeoId}`}
            className="font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Watch this lesson
          </Link>
        </p>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 flex size-9 items-center justify-center rounded-full border border-navy-600 bg-navy-850 text-ink-muted transition-colors hover:text-ink"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
