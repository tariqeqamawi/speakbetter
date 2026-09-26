import Image from "next/image";
import { categories } from "@/data/categories";
import { LionMouth } from "@/components/lion-mouth";
import { BookIcon, VideoIcon } from "@/components/icons";

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
        <DeckFan />
      </Tile>
      <Tile on={h("coach")} label="The coach watches">
        <span className="w-14 overflow-hidden">
          <LionMouth level={0} className="w-full" />
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
      <Tile on={h("book")} label="The book">
        <span className="grid size-11 place-items-center rounded-md border border-navy-500 bg-navy-800 text-storytelling">
          <BookIcon className="size-6" />
        </span>
      </Tile>
    </div>
  );
}
