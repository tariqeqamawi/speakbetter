"use client";

import { useEffect, useRef, useState } from "react";
import { TalkingLion } from "@/components/talking-lion";
import { pickRoar } from "@/data/greetings";

// "Ready for the challenge?" - the card that decides whether a student
// records today.
//
// Everything else on a challenge page is information. This is the ask,
// so it is built like the coach's own page rather than like another
// panel: the lion large in the middle, the record button under him,
// and nothing competing for the eye.
//
// And he speaks when you reach it. Once, when the card comes into
// view - the moment a coach in the room would actually say something -
// and never again on that visit, because a lion who shouts every time
// you scroll past is a lion you mute.

export function ReadyCard({ children, title = "Ready for the challenge?" }: { children: React.ReactNode; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [roar, setRoar] = useState<{ text: string; src: string } | null>(null);
  const spoken = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || spoken.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Most of the card on screen, not a sliver of it: he speaks
          // when a student has arrived, not as they pass by.
          if (!e.isIntersecting || e.intersectionRatio < 0.6 || spoken.current) continue;
          spoken.current = true;
          setRoar(pickRoar());
          io.disconnect();
        }
      },
      { threshold: [0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-tour="record"
      className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-navy-500 bg-navy-800 px-5 py-8 text-center"
    >
      {/* the light he stands in */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-56 opacity-50 blur-3xl"
        style={{ background: "radial-gradient(45% 100% at 50% 100%, var(--color-acting), transparent 70%)" }}
      />
      <span aria-hidden className="spectrum-rule absolute inset-x-0 top-0 h-1" />

      <h2 className="relative text-2xl font-bold tracking-tight text-ink text-balance sm:text-3xl">
        {roar?.text ?? title}
      </h2>

      {/* Him, at the size he is on his own page. */}
      <TalkingLion
        bare
        controls={false}
        className="relative w-full max-w-[16rem] shrink-0"
        text={roar?.text}
        audioSrc={roar?.src}
        autoPlay={Boolean(roar)}
      />

      <div className="relative flex w-full flex-col items-center gap-4">{children}</div>
    </div>
  );
}
