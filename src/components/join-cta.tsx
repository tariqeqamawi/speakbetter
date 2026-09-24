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

export function JoinCta({ label }: { label: string }) {
  return (
    <div className="flex justify-center">
      <a href="#pricing" className="cta-neon-wrap rounded-xl">
        <span className="cta-neon-glow rounded-xl" aria-hidden />
        <span className="cta-neon block rounded-xl px-9 py-4 text-base">{label}</span>
      </a>
    </div>
  );
}
