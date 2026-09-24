import Image from "next/image";

// The promise, said and then shown.
//
// WHY THERE IS A PICTURE HERE AT ALL. "Imagine the cameras are
// rolling" asks the reader to do the work of picturing themselves
// succeeding - which is precisely the thing the nervous speaker this
// page is written for cannot currently do. That is close to the
// definition of the problem being sold against. Showing it, with the
// reactions arriving, does the imagining for them.
//
// It is deliberately a phone, a ring light and a stream of reactions
// rather than a stage and an auditorium: that is where most people's
// speaking now actually happens, and it is a room they can picture
// themselves standing in tonight.

/**
 * The still, once it has been rendered.
 *
 * Null until then, and the section simply runs as the full-width
 * paragraph it has always been - which is why this is a constant
 * rather than a missing file. A broken image is worse on a sales page
 * than no image at all, and "we will add it later" is not a state a
 * build should be able to ship in by accident.
 */
const STILL: string | null = null;

/** The reactions floating up the side, as they arrive on a live. */
const REACTIONS = [
  { emoji: "🔥", at: "12%", delay: "0s", size: "text-2xl" },
  { emoji: "👏", at: "34%", delay: "1.4s", size: "text-xl" },
  { emoji: "❤️", at: "58%", delay: "2.6s", size: "text-2xl" },
  { emoji: "😮", at: "76%", delay: "4.1s", size: "text-lg" },
  { emoji: "🙌", at: "90%", delay: "5.3s", size: "text-xl" },
];

export function TheReality() {
  const words = (
    <p className="text-xl font-medium leading-snug text-ink text-balance sm:text-2xl">
      Imagine the cameras are rolling, the audience is waiting, the stage is set - and you have no fear, no
      nerves, just full confidence and the ability to deliver at a level of mastery with no notes and no
      notice.{" "}
      <span className="text-figurative">This is the reality waiting for you on the other side of Speak Better.</span>
    </p>
  );

  if (!STILL) return <div className="max-w-2xl">{words}</div>;

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 lg:flex-row lg:gap-10">
      <div className="max-w-2xl lg:flex-1">{words}</div>

      <div className="relative w-full max-w-sm shrink-0 lg:w-[22rem]">
        <div className="relative overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
          <Image
            src={STILL}
            alt="Speaking to camera on a phone under a ring light, with reactions coming in"
            width={880}
            height={1100}
            className="h-auto w-full"
          />

          {/* The room reacting. Floated over the still rather than baked
              into it, so the reactions arrive one after another the way
              they do on a live - a frozen row of emoji inside a
              photograph reads as a sticker, not a crowd. */}
          <span aria-hidden className="pointer-events-none absolute inset-0">
            {REACTIONS.map((r) => (
              <span
                key={r.emoji}
                className={`reaction-float absolute bottom-6 ${r.size}`}
                style={{ left: r.at, animationDelay: r.delay }}
              >
                {r.emoji}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
