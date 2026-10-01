"use client";



import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { VideoStill } from "@/components/video-still";
import { PlayFillIcon } from "@/components/player-icons";
import { LessonCard, CardFaceDown } from "@/components/lesson-card";
import { CategoryIcon } from "@/components/category-icons";
import { categories, type Category, type CategoryId } from "@/data/categories";
import { type DeckCardData } from "@/data/deck";
import { hapticTap, playXpChime } from "@/lib/feedback-fx";
import {
  ChevronDownIcon,
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
  | { mode: "color"; category: CategoryId; index: number }
  | { mode: "spread" };

/** A card opened full size, and the cards it sits among. */
type Zoom = { list: DeckCard[]; index: number };

/** How hard a shake has to be before it counts as one. */
const SHAKE_FORCE = 24;

const SHAKE_COOLDOWN = 900;

/** One card taken at random from a list. */
function anyOf(cards: DeckCard[]): DeckCard {
  return cards[Math.floor(Math.random() * cards.length)];
}

export function CardDeck({ cards }: { cards: DeckCard[] }) {
  // No dial in front of the deck: it opens straight onto one colour's
  // fan - the colour asked for in the address, or one at random - with
  // the strip of colours beneath it to move between them. (Null for the
  // first moment, until that's chosen in the browser.)
  const [view, setView] = useState<View | null>(null);
  // The colour last open, for the way back from a dealt spread.
  const [lastColor, setLastColor] = useState<{ category: CategoryId; index: number } | null>(null);
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const [shakeOn, setShakeOn] = useState(false);
  // The dealt spread, kept while the student walks away into a color and
  // comes back - a hand you have to re-deal to look at twice is a hand
  // you can't think with.
  const [hand, setHand] = useState<DeckCard[] | null>(null);

  const inSection = useCallback(
    (id: CategoryId) => cards.filter((c) => c.categoryId === id),
    [cards],
  );

  const openColor = useCallback((category: CategoryId, index = 0) => {
    hapticTap();
    setView({ mode: "color", category, index });
  }, []);

  // Arriving: from a colour's "Flash cards" tab (skills-browser.tsx),
  // /skills/cards?color=voice opens onto that colour's cards; otherwise
  // a colour at random, so each visit starts somewhere new.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("color");
    const stocked = categories.filter((c) => cards.some((d) => d.categoryId === c.id));
    if (!stocked.length) return;
    const pick =
      wanted && stocked.some((c) => c.id === wanted)
        ? (wanted as CategoryId)
        : stocked[Math.floor(Math.random() * stocked.length)].id;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chosen once, on arrival, in the browser
    setView({ mode: "color", category: pick, index: 0 });
  }, [cards]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- remembered for the way back from a spread
    if (view?.mode === "color") setLastColor({ category: view.category, index: view.index });
  }, [view]);

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

  // The two ways in that aren't a colour, drawn as two things rather
  // than said as two labels: a fan of seven, and one card pulled at
  // random. Under the colour's fan now that there's no dial to hold them.
  const waysIn = (
    <div className="flex flex-col items-center gap-3 pt-3">
      <div className="grid w-full max-w-md grid-cols-2 gap-2.5">
        <button
          type="button"
          data-tour="spread"
          onClick={deal}
          className="group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 px-3 py-4 transition-colors hover:border-ink-faint"
        >
          <span aria-hidden className="spectrum-rule absolute inset-x-0 top-0 h-1" />
          <FanMark />
          <span className="text-sm font-bold text-ink">Deal a full spread</span>
          <span className="text-[0.7rem] leading-tight text-ink-faint">One card of every color</span>
        </button>
        <button
          type="button"
          data-tour="shuffle"
          // One tap, one card: pulled at random from the whole deck and
          // shown. (The first tap also switches shaking on, where the
          // phone has to ask - so a shake does the same from then on.)
          onClick={() => {
            pullRandom();
            if (!shakeOn) void enableShake();
          }}
          className="group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 px-3 py-4 transition-colors hover:border-ink-faint"
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-figurative/70" />
          <span className="deck-shake grid size-10 place-items-center text-figurative">
            <RepeatIcon className="size-7" />
          </span>
          <span className="text-sm font-bold text-ink">Random card</span>
          <span className="text-[0.7rem] leading-tight text-ink-faint">Any card from the whole deck</span>
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
    </div>
  );

  // (The first moment, before a colour is chosen: the deck's room held,
  // so nothing jumps when it arrives.)
  if (!view) return <div data-tour="deck" className="min-h-[34rem]" aria-busy />;

  if (view.mode === "color") {
    const list = inSection(view.category);
    const section = categories.find((c) => c.id === view.category)!;
    return (
      <div data-tour="deck" className="flex flex-col gap-2">
        <ColorCarousel
          cards={list}
          section={section}
          index={Math.min(view.index, list.length - 1)}
          onIndex={(index) => setView({ ...view, index })}
          onSection={(id) => openColor(id)}
          onZoom={(index) => setZoom({ list, index })}
          countIn={(id) => inSection(id).length}
        />
        {waysIn}
        {overlay}
      </div>
    );
  }

  if (view.mode === "spread" && hand) {
    return (
      <>
        <FullSpread
          key={hand.map((c) => c.vimeoId).join()}
          hand={hand}
          onZoom={(index) => setZoom({ list: hand, index })}
          onDeal={deal}
          onBack={() => setView({ mode: "color", category: lastColor?.category ?? categories[0].id, index: lastColor?.index ?? 0 })}
        />
        {overlay}
      </>
    );
  }

  return null;
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
  countIn,
}: {
  cards: DeckCard[];
  section: Category;
  index: number;
  onIndex: (index: number) => void;
  onSection: (id: CategoryId) => void;
  onZoom: (index: number) => void;
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

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
        <h2 className="text-lg font-semibold tracking-tight" style={{ color }}>
          {section.name}
          <span className="ml-2 text-xs font-medium text-ink-muted">{section.subtitle}</span>
        </h2>
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
 * This is the deck's whole argument in one gesture. A card of every
 * colour on the table is the ingredients for a talk that moves - a
 * story, the language to paint it, a way to perform it, a shape, a
 * mindset, a body, a finish - and no two deals hand you the same talk.
 * Random on purpose: a hand you chose is a hand of what you already do.
 *
 * Laid out like a colour's fan (ColorCarousel): one card face up in the
 * middle, the rest of the hand stacked away either side face down - each
 * in its own colour's back, so it's plain at a glance this is one of
 * every colour. Slide a thumb across, or use the arrows, and each comes
 * up in turn. Under it, two tabs: Your spread - the hand's lessons as a
 * stack, each opening its video - and Deal again.
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
  // Starts on the middle of the hand, so the fan opens both ways.
  const [index, setIndex] = useState(Math.floor((hand.length - 1) / 2));
  const [listOpen, setListOpen] = useState(false);
  const [gathering, setGathering] = useState(false);
  const dealing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const skillsHref = usePathname()?.startsWith("/demo") ? "/demo/skills" : "/skills";
  const DEPTH = 3;
  const card = hand[index];

  // A deal in two beats: the fan closes into a pile, the hand changes
  // while it's stacked, and the new one fans out - the gesture a person
  // makes, rather than seven cards blinking into new colours on the spot.
  const deal = () => {
    if (gathering) return;
    hapticTap();
    setGathering(true);
    dealing.current = setTimeout(() => {
      onDeal();
      setGathering(false);
    }, 300);
  };
  useEffect(
    () => () => {
      if (dealing.current) clearTimeout(dealing.current);
    },
    [],
  );

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0 || next >= hand.length) return;
      hapticTap();
      setIndex(next);
    },
    [index, hand.length],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Scrub with a thumb, as in a colour's fan.
  const drag = useRef<number | null>(null);
  const dragged = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = e.clientX;
    dragged.current = false;
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
  const section = categories.find((c) => c.id === card.categoryId);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronDownIcon className="size-4 rotate-90" />
          Back
        </button>
        <span className="spectrum-text text-xs font-bold uppercase tracking-[0.2em]">Your spread</span>
        <span className="w-12" aria-hidden />
      </div>

      {/* The fan: the card in front face up, the rest of the hand face
          down either side, each in its own colour's back. */}
      <div
        className="relative mx-auto flex aspect-[5/4] w-full max-w-lg touch-pan-y select-none items-center justify-center lg:max-w-3xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {hand.map((c, i) => {
          const d = i - index;
          if (Math.abs(d) > DEPTH) return null;
          const near = Math.min(Math.abs(d), DEPTH);
          const front = d === 0;
          const cat = categories.find((x) => x.id === c.categoryId);
          return (
            <span
              // (By seat, so a new deal travels rather than blinks in.)
              key={i}
              className="deck-stack-card absolute w-[44%] max-w-[14rem] lg:max-w-[21rem]"
              style={{
                zIndex: 20 - near,
                opacity: gathering ? 0.6 : 1 - near * 0.16,
                transform: gathering
                  ? `rotate(${d * 1.6}deg) scale(0.94)`
                  : `translateX(${d * 24}%) rotate(${d * 6}deg) scale(${1 - near * 0.08})`,
              }}
            >
              {front ? (
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
                    setIndex(i);
                  }}
                  aria-label={`${cat?.name ?? ""} card, ${i + 1} of ${hand.length}`}
                  className="card-3d relative block aspect-[89/127] w-full"
                >
                  <CardFaceDown section={cat?.name ?? ""} code={cat?.code ?? ""} color={`var(--color-${c.categoryId})`} />
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Which card, and the way to read it big. */}
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
          Open card
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index >= hand.length - 1}
          aria-label="Next card"
          className="rounded-lg px-2 py-1 text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
        >
          <ChevronDownIcon className="size-4 -rotate-90" />
        </button>
      </div>
      <p className="text-center text-xs text-ink-faint">
        <span className="tabular-nums">
          {index + 1} of {hand.length}
        </span>
        {section ? <span className={section.textClass}>{` · ${section.name}`}</span> : null}
      </p>

      {/* Two tabs: the hand's lessons, and a new hand. */}
      <div className="flex w-full max-w-lg gap-1 rounded-xl border border-navy-600 bg-navy-900/60 p-1">
        <button
          type="button"
          aria-expanded={listOpen}
          onClick={() => setListOpen((v) => !v)}
          className={`flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            listOpen ? "bg-navy-800 text-ink ring-1 ring-body-language/70" : "text-ink-faint hover:text-ink-muted"
          }`}
        >
          Your spread
          <ChevronDownIcon className={`size-3.5 transition-transform ${listOpen ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={deal}
          disabled={gathering}
          className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-faint transition-colors hover:text-ink-muted disabled:opacity-60"
        >
          <RepeatIcon className={`size-4 ${gathering ? "animate-spin" : ""}`} />
          Deal again
        </button>
      </div>

      {/* The hand's lessons, one under another - only these, so the
          spread doesn't get muddled with a colour's full list. Each
          opens its video, on its colour's page. */}
      {listOpen && (
        <ul className="challenge-enter flex w-full max-w-lg flex-col gap-2.5">
          {hand.map((c, i) => {
            const cat = categories.find((x) => x.id === c.categoryId);
            return (
              <li key={c.vimeoId}>
                <Link
                  href={`${skillsHref}/${c.categoryId}?lesson=${c.vimeoId}`}
                  onMouseEnter={() => setIndex(i)}
                  className={`lift-card group flex w-full items-center gap-3 overflow-hidden rounded-xl border pr-3 text-left ${cat?.textClass ?? ""} ${
                    i === index ? "border-current" : "border-navy-600 hover:border-current"
                  }`}
                >
                  <span className="relative block aspect-video w-32 shrink-0 bg-gradient-to-br from-navy-700 to-navy-900 sm:w-40">
                    {cat && <VideoStill vimeoId={c.vimeoId} accent={cat} sizes="160px" />}
                    <span className={`absolute inset-x-0 bottom-0 h-0.5 ${cat?.bgClass ?? ""}`} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5 py-2">
                    <span className="text-[0.6rem] font-bold uppercase tracking-wider">{cat?.name}</span>
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">{c.title}</span>
                  </span>
                  <PlayFillIcon className="ml-auto size-4 shrink-0 text-ink-faint transition-colors group-hover:text-current" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
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

/** Seven cards fanned - what "deal a full spread" actually looks like,
 *  small enough to sit on a button. */
function FanMark() {
  return (
    <span aria-hidden className="grid size-10 place-items-center">
      <svg viewBox="0 0 44 34" className="h-9 w-auto overflow-visible">
        {categories.map((cat, i) => {
          const angle = (i - (categories.length - 1) / 2) * 13;
          return (
            <rect
              key={cat.id}
              x="18"
              y="6"
              width="8"
              height="22"
              rx="2"
              className={cat.textClass}
              fill="currentColor"
              opacity="0.9"
              transform={`rotate(${angle} 22 30)`}
            />
          );
        })}
      </svg>
    </span>
  );
}
