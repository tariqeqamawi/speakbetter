import Image from "next/image";

// The hero's two-beat headline with its pictures: the premise (a seat
// in a concert crowd, watching someone else sing) and the punchline it
// sets up (a lecture on a laptop, the hours ticking by). The lines and
// the pictures share one ten-second cycle (globals.css, .hero-line and
// .hero-pic), so the picture changes as the line does. Both beats are
// in the DOM from the first paint; the animation only decides which is
// visible, and with reduced motion both lines show, stacked, over the
// first picture.

const BEATS = [
  {
    image: "/hero/concert.jpg",
    alt: "Seen from a seat in the crowd: a singer on a lit stage, far away",
    line: "You don't learn to sing by going to concerts.",
  },
  {
    image: "/hero/lecture.jpg",
    alt: "Slumped at a laptop at night, a lecture playing, the clock going round",
    line: "So you won't become a speaker by only watching videos.",
  },
];

export function HeroBeat() {
  return (
    <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-navy-600 bg-navy-950 shadow-2xl shadow-navy-950/80">
      <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
        {BEATS.map((b, i) => (
          <Image
            key={b.image}
            src={b.image}
            alt={b.alt}
            fill
            sizes="(min-width: 672px) 672px, 100vw"
            priority={i === 0}
            className={`object-cover ${i === 0 ? "hero-pic-first" : "hero-pic-second"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent" />
      </div>
      <h2 className="absolute inset-x-0 bottom-0 grid p-5 text-2xl font-semibold tracking-tight text-ink text-balance sm:p-7 sm:text-3xl">
        {BEATS.map((b, i) => (
          <span key={b.line} className={`hero-line ${i === 0 ? "hero-line-first" : "hero-line-second"}`}>
            {b.line}
          </span>
        ))}
      </h2>
    </div>
  );
}
