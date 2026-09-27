import { Avatar } from "@/components/avatar";
import { credit, proofOf, type Proof } from "@/data/testimonials";

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
  const who = credit(quote);

  return (
    // Its own moment, not one more card: a still pull-quote on blue
    // glass, larger than the drifting walls of testimonials and kept
    // apart from them - set against the section whose claim it proves.
    <figure className="blue-glass relative mx-auto flex w-full max-w-3xl flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center sm:px-12 sm:py-10">
      <span aria-hidden className="absolute left-5 top-2 font-serif text-7xl leading-none text-body-language/40 sm:left-8">
        &ldquo;
      </span>
      <blockquote className="text-lg font-medium leading-relaxed text-ink text-balance sm:text-xl">{quote.quote}</blockquote>
      <figcaption className="flex items-center gap-2.5">
        <Avatar name={who} className="size-9 shrink-0" />
        <span className="text-sm font-semibold text-ink-muted">{who}</span>
      </figcaption>
    </figure>
  );
}
