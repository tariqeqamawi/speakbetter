import Image from "next/image";
import { categories } from "@/data/categories";
import { LionMouth } from "@/components/lion-mouth";
import { VideoIcon } from "@/components/icons";

// What a tier includes, as pictures from the app itself: a few lesson
// stills, the deck fanned in its seven colors (digital, or printed
// and posted), the lion for the coach, a trophy, the teacher's live
// session, the book. Each tile is drawn lit where the tier has it and
// dim where it doesn't, so the columns fill in as the list does.

const STILLS = ["1081030429", "1081031495", "1081197407"];

function Tile({
  on,
  label,
  children,
}: {
  on: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={`flex flex-col items-center gap-1 ${on ? "" : "opacity-30 saturate-0"}`}>
      <span className="grid h-16 w-full place-items-center overflow-hidden rounded-xl border border-navy-600 bg-navy-900/70">
        {children}
      </span>
      <figcaption className={`text-center text-[0.6rem] font-semibold uppercase tracking-wider ${on ? "text-ink-muted" : "text-ink-faint"}`}>
        {label}
      </figcaption>
    </figure>
  );
}

/** The deck, fanned: seven backs in the seven colors. */
export function DeckFan({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block h-12 w-20 ${className}`} aria-hidden>
      {categories.map((cat, i) => {
        const d = i - 3;
        return (
          <span
            key={cat.id}
            className={`absolute left-1/2 top-1 h-11 w-7 rounded-[3px] ${cat.bgClass} shadow-[0_2px_6px_rgba(3,7,18,0.6)]`}
            style={{ transform: `translateX(-50%) translateX(${d * 7}px) rotate(${d * 9}deg) translateY(${Math.abs(d) * 2}px)` }}
          />
        );
      })}
    </span>
  );
}

export function TierArt({ has }: { has: string[] }) {
  const h = (id: string) => has.includes(id);
  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile on={h("lessons")} label="83 lessons">
        <span className="flex gap-1 px-1">
          {STILLS.map((id) => (
            <span key={id} className="relative h-9 w-6 overflow-hidden rounded-[3px] ring-1 ring-navy-600">
              <Image src={`/thumbs/${id}.jpg`} alt="" fill sizes="24px" className="object-cover" />
            </span>
          ))}
        </span>
      </Tile>
      <Tile on={h("deck")} label={h("printed") ? "Deck: app + printed" : "Deck: in the app"}>
        {h("printed") ? (
          // The printed deck, as it arrives: the cards fanned on a desk,
          // three face up, beside their box (public/deck, rendered from
          // the real card faces and backs).
          <span className="relative block size-full">
            <Image
              src="/deck/printed-deck-oak-v2.webp"
              alt="The printed Speak Better deck fanned on a desk beside its box"
              fill
              sizes="120px"
              className="object-cover"
            />
          </span>
        ) : (
          <DeckFan />
        )}
      </Tile>
      <Tile on={h("coach")} label="The coach watches">
        {/* The lion over what he writes: a snapshot of a real review's
            report - the spectrum wave and the colour bars - behind him. */}
        <span className="relative grid size-full place-items-center">
          <Image
            src="/tiers/coach-report.webp"
            alt=""
            fill
            sizes="120px"
            className="object-cover object-top opacity-60"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/20 to-transparent" />
          <span className="relative w-12 overflow-hidden drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <LionMouth level={0} className="w-full" />
          </span>
        </span>
      </Tile>
      <Tile on={h("loop")} label="Trophies & ranks">
        <span className="relative size-11">
          <Image src="/badges/challenge-describe-vividly.png" alt="" fill sizes="44px" className="object-contain" />
        </span>
      </Tile>
      <Tile on={h("live")} label="Live with the teacher">
        <span className="relative h-11 w-16 overflow-hidden rounded-md">
          <Image src="/thumbs/1081200781.jpg" alt="" fill sizes="64px" className="object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-navy-950/40 text-ink">
            <VideoIcon className="size-4" />
          </span>
        </span>
      </Tile>
      {/* The book itself - Speak Better: The 8 Colors of Fearless, Unforgettable Speaking - (was: Express Your True Colors and Roar
          on Screen and Stage - rendered from the copy Tariq holds up in
          the storybook lesson (public/book). */}
      <Tile on={h("book")} label="The book">
        <span className="relative block size-full">
          <Image
            src="/book/book-oak-v2-portrait.webp"
            alt="The Speak Better book: The 8 Colors of Fearless, Unforgettable Speaking, by Tariq EQ Amawi"
            fill
            sizes="120px"
            className="object-cover"
          />
        </span>
      </Tile>
    </div>
  );
}
