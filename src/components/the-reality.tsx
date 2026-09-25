import Image from "next/image";
import { Reveal } from "@/components/reveal";

// The promise, said over the places it comes true.
//
// "Imagine the cameras are rolling" asks the reader to picture themselves
// succeeding - which is exactly what the nervous speaker this page is
// written for cannot yet do. So the words sit over the pictures that do
// it for them: everywhere speaking now happens - as real creator content
// looks, webcam and phone quality, not cinematic. Into a laptop, to a phone
// on a tripod, vlogging down a street, on a stage, on a podcast - five
// rooms, one of which is theirs tonight.
//
// Full width, the photographs drifting slowly, darkened towards the
// middle so the words read clearly over them.

const SCENES = [
  { src: "/reality/gopro-2.webp", alt: "Talking to a GoPro while walking in a park", span: "col-span-1 sm:col-span-2" },
  { src: "/reality/stage-2.webp", alt: "A speaker at an event, the crowd filming on their phones", span: "col-span-2 sm:col-span-2" },
  { src: "/reality/tripod-2.webp", alt: "Filming himself on a phone on a tripod", span: "col-span-1 sm:col-span-2" },
  { src: "/reality/vlog-2.webp", alt: "Vlogging down a city street, seen from behind", span: "col-span-1 sm:col-span-3" },
  { src: "/reality/podcast-2.webp", alt: "Speaking into a podcast microphone", span: "col-span-1 sm:col-span-3" },
];

export function TheReality() {
  return (
    <section className="relative mx-[calc(50%-50vw)] w-screen max-w-none overflow-hidden">
      <div aria-hidden className="grid h-[38rem] grid-cols-2 grid-rows-3 gap-1 sm:h-[36rem] sm:grid-cols-6 sm:grid-rows-2">
        {SCENES.map((s, i) => (
          <div
            key={s.src}
            className={`relative overflow-hidden ${s.span} ${i === 1 ? "row-start-1 sm:row-start-auto" : ""}`}
          >
            <Image
              src={s.src}
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="reality-drift object-cover"
              style={{ animationDelay: `${-i * 3.5}s` }}
            />
          </div>
        ))}
      </div>

      {/* Darker towards the middle, where the words are, and faded into
          the page top and bottom. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(5,9,20,0.86), rgba(5,9,20,0.55) 60%, rgba(5,9,20,0.35)), linear-gradient(180deg, var(--color-navy-950), transparent 18%, transparent 82%, var(--color-navy-950))",
        }}
      />

      <Reveal className="absolute inset-0 flex items-center justify-center px-6" threshold={0.35}>
        <p
          className="rv max-w-2xl text-center text-2xl font-semibold leading-snug text-ink text-balance sm:text-3xl"
          style={{ textShadow: "0 2px 18px rgba(0,0,0,0.9)" }}
        >
          Imagine the cameras are rolling, the audience is waiting, the stage is set - and you have no fear, no
          nerves, just full confidence and the ability to deliver at a level of mastery with no notes and no
          notice.{" "}
          <span className="text-figurative">This is the reality waiting for you on the other side of Speak Better.</span>
        </p>
      </Reveal>
    </section>
  );
}
