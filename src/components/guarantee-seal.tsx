import { guarantee } from "@/data/pricing";

// The guarantee as a seal: the lion inside a ring of the seven colours,
// "14-day money-back guarantee" round the edge.
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
      src={size > 140 ? "/guarantee/seal-2x.webp" : "/guarantee/seal.webp"}
      alt={guarantee.title}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`shrink-0 select-none drop-shadow-[0_6px_24px_rgba(0,0,0,0.5)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
