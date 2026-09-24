import { Avatar } from "@/components/avatar";
import { proofOf, type Proof } from "@/data/testimonials";

// One student's words, set against the claim they prove.
//
// WHY INLINE RATHER THAN IN THE STREAM. The drifting sections up the
// page say "a lot of people liked this". That is a different job from
// what this does, which is answer the specific doubt a reader has just
// had. Somebody who has read "eighty-one lessons, one to two minutes
// each" is wondering whether short lessons can possibly be enough, and
// Dave Anderson saying he gets more from them every time he watches
// answers exactly that, in the place the doubt occurs.
//
// So each section on the page names what it is claiming, and this
// finds a quote that evidences it. A quote that could sit under any
// heading is decoration; a quote that could only sit under this one is
// evidence.

export function ProofLine({ tag, skip = 0 }: { tag: Proof; skip?: number }) {
  const quote = proofOf(tag)[skip];
  if (!quote) return null;

  return (
    <figure className="flex w-full max-w-2xl gap-3 rounded-2xl border border-navy-600 bg-navy-800/70 p-4">
      <Avatar name={quote.name} className="size-9 shrink-0" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <blockquote className="text-sm leading-relaxed text-ink-muted">
          &ldquo;{quote.quote}&rdquo;
        </blockquote>
        <figcaption className="text-xs font-semibold text-ink-faint">{quote.name}</figcaption>
      </div>
    </figure>
  );
}
