import { guarantee } from "@/data/pricing";

// The guarantee as a seal in solid gold - a real minted medallion, not a
// drawing: the lion embossed at its centre,
// "14-day money-back guarantee" round the edge - gold, because a
// guarantee should look like one.
//
// A guarantee said in a sentence is read as small print; the same
// promise as an object reads as something the seller is standing behind.
// It sits where somebody is deciding - beside the first and last of the
// buttons to the tiers, and in the panel under the prices - and nowhere
// it would be decoration. The words are in the picture, so they are in
// the alt text too.

export function GuaranteeSeal({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={size > 110 ? "/guarantee/seal-metal-2x.webp" : "/guarantee/seal-metal.webp"}
      alt={guarantee.title}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`shrink-0 select-none drop-shadow-[0_6px_28px_rgba(255,190,60,0.28)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
