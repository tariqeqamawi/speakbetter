import { GuaranteeSeal } from "@/components/guarantee-seal";
import { guarantee, tiers } from "@/data/pricing";

// The way to the tiers, offered more than once.
//
// A long page with its only door at the bottom asks somebody who has
// already decided to keep scrolling past things they no longer need to
// read. So the same door stands at the points where a reader is most
// likely to have made up their mind - after what it is, after Coach
// has been shown working, after the library, just before the prices -
// each one saying it a little differently, so it reads as a voice
// rather than a banner repeated. Every one goes to the same place: the
// three tiers.

export function JoinCta({ label, seal = false, price = false }: { label: string; seal?: boolean; price?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
      <span className="flex flex-col items-center gap-2">
        <a href="#pricing" className="cta-neon-wrap rounded-xl">
          <span className="cta-neon-glow rounded-xl" aria-hidden />
          <span className="cta-neon block rounded-xl px-9 py-4 text-base">{label}</span>
        </a>
        {/* What it costs, in a line - the question answered where it is
            asked, without the whole table of tiers. */}
        {price && (
          <span className="text-xs font-medium text-ink-muted">
            From {tiers[0].price} · {guarantee.title}
          </span>
        )}
      </span>
      {/* The guarantee beside the ask, where the question it answers is
          being asked (guarantee-seal.tsx). */}
      {seal && <GuaranteeSeal size={116} />}
    </div>
  );
}
