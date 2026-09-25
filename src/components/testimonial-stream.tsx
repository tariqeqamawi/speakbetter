import { Avatar } from "@/components/avatar";
import { SleepOffscreen } from "@/components/sleep-offscreen";
import { credit, type Testimonial } from "@/data/testimonials";

// Students' own words, floating up the page.
//
// WHY IT MOVES. A wall of twenty-six quotes is read as "there are a
// lot of quotes" and not one of them is actually read. Floating them
// makes each one arrive on its own, so the eye lands on a single
// sentence, finishes it, and the next one comes - which is how
// somebody actually takes in social proof.
//
// WHY LOOSE RATHER THAN IN COLUMNS. It used to be three lanes marching
// up in step, which reads as a list on a conveyor - tidy, and plainly a
// widget. Each quote now rises on its own, from its own place across
// the width, at its own size, the way comments come up over a video:
// scattered, a few in the air at once, sometimes crossing. It looks
// like people talking rather than a component displaying them.
//
// HOW. Every quote shares one cycle and rises during its own slice of
// it - staggered by the same gap, so there are always about the same
// number in the air and they never bunch up. A quote takes twenty
// seconds to cross, because these are sentences to be read, not
// one-word comments. Hover to hold them still. Pure transform and
// opacity, so the compositor carries it and the main thread does
// nothing - the rule everywhere in this app.
//
// WHY THE FACES ARE NOT PHOTOGRAPHS. These are real people's words.
// An invented portrait beside a real name is a picture of somebody who
// does not exist being presented as them, on the page where a stranger
// decides whether to trust this. So each quote carries the app's own
// mark: their initial on one of the seven colours. Real photographs,
// with permission, would drop straight into the same slot.

/** Seconds for one quote to cross the field. Long enough to read one. */
const RISE = 20;
/** Where each quote sets off from, as a share of the free width - dealt
 *  so that one quote never starts where the last one did. */
const LANES = [0.08, 0.66, 0.34, 0.92, 0.2, 0.52, 0.8, 0.02, 0.44, 0.72];
/** A little variety in size, so they do not look stamped out. */
const WIDTHS = [19, 21, 18, 20.5, 19.5, 22, 18.5];

export function TestimonialStream({
  items,
  /** Roughly how many are in the air at once on a wide screen. */
  columns = 3,
}: {
  items: Testimonial[];
  columns?: number;
}) {
  if (items.length === 0) return null;

  // Two more than the old column count: loose quotes take up less of the
  // eye than lanes did, and a field with two in it looks empty.
  const aloft = Math.min(items.length, columns + 2);
  const gap = RISE / aloft;
  const cycle = gap * items.length;
  // The share of the cycle a quote spends rising; the rest it waits
  // below the field for its turn to come round again.
  const share = (RISE / cycle) * 100;
  const name = `quote-float-${items.length}-${aloft}`;

  // Asleep off screen, so the quotes only float while somebody can see
  // them (sleep-offscreen.tsx says why that matters).
  return (
    <SleepOffscreen
      // Edge to edge of the screen, out of the page's column, and faded
      // top and bottom by a mask rather than bands of navy: the quotes
      // dissolve into whatever glow is behind them, with no box around
      // them - bands of a flat colour over a lit background read as a
      // letterbox.
      className="quote-field relative mx-[calc(50%-50vw)] w-screen max-w-none overflow-hidden"
      style={{
        height: "var(--field)",
        ["--field" as string]: "min(34rem, 80vh)",
        maskImage: "linear-gradient(180deg, transparent, #000 5rem, #000 calc(100% - 5rem), transparent)",
        WebkitMaskImage: "linear-gradient(180deg, transparent, #000 5rem, #000 calc(100% - 5rem), transparent)",
      }}
    >
      <style>{`@keyframes ${name} {
  0% { transform: translate3d(0, 0, 0); opacity: 0; }
  ${(share * 0.12).toFixed(2)}% { opacity: 1; }
  ${(share * 0.78).toFixed(2)}% { opacity: 1; }
  ${share.toFixed(2)}%, 100% { transform: translate3d(0, calc(-1 * var(--field) - 100%), 0); opacity: 0; }
}`}</style>
      {items.map((t, i) => {
        const w = WIDTHS[i % WIDTHS.length];
        const at = LANES[i % LANES.length];
        return (
          <div
            key={`${credit(t)}-${t.quote.slice(0, 12)}`}
            className="quote-float absolute top-full"
            style={{
              // Across the free width, never past either edge.
              left: `calc((100% - min(${w}rem, 88%)) * ${at})`,
              width: `min(${w}rem, 88%)`,
              animationName: name,
              animationDuration: `${cycle}s`,
              // Negative, so the field is already populated on arrival
              // rather than filling up from empty.
              animationDelay: `${-(items.length - i) * gap}s`,
            }}
          >
            <Quote t={t} />
          </div>
        );
      })}

    </SleepOffscreen>
  );
}

function Quote({ t }: { t: Testimonial }) {
  // Initials where there are initials - and the avatar takes the same
  // string, so the letter on the chip and its colour both come from
  // what is actually shown rather than from a name being withheld.
  const who = credit(t);
  return (
    // White, against a page that is otherwise entirely dark - so a
    // quote reads as something lifted from elsewhere rather than as
    // more of the seller's own copy. See .quote-card in globals.
    <figure className="quote-card flex flex-col gap-2.5 rounded-2xl border p-4 shadow-2xl shadow-navy-950/60">
      <blockquote className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="flex items-center gap-2.5">
        <Avatar name={who} className="size-8" />
        <span className="quote-name text-xs font-semibold">{who}</span>
      </figcaption>
    </figure>
  );
}
