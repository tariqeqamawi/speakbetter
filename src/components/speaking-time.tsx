import { categories } from "@/data/categories";

// How long this student has spent speaking to a lens, as the headline
// of the challenges panel.
//
// It was one grey sentence among three small figures, and of the three
// it is the one that is purely theirs: a score is a judgement and a
// count of passes is a gate, but minutes spoken is just what they did,
// and nobody can take it off them. So it is the big number, drawn in
// all seven colors.
//
// And what is said under it grows with the number. "Every minute
// counts" is right at four minutes and faintly insulting at ninety, so
// past the early lines the praise stops being encouragement and starts
// being a comparison: this is as long as a documentary, this is a
// feature film in which you played every part. A figure a student
// cannot picture is a figure they cannot be proud of.

interface Tier {
  /** From this many minutes. */
  from: number;
  line: string;
}

const TIERS: Tier[] = [
  { from: 1, line: "Well done - every minute in front of the lens counts." },
  { from: 5, line: "Great work. Every minute practiced is more confidence gained." },
  { from: 10, line: "Keep going - you're getting better by the take." },
  { from: 15, line: "That's longer than a TED talk, and every second of it was you." },
  { from: 20, line: "That's two TED talks' worth of time on camera. Most people never record one." },
  { from: 30, line: "That's a half-hour show - and you played every part in it." },
  { from: 40, line: "That's as long as most keynotes, and about an episode of your favorite show. Well done." },
  { from: 60, line: "That's the length of a full documentary. You're right on track." },
  { from: 75, line: "That's the length of a whole movie, where you're playing all of the roles. Go you." },
  { from: 120, line: "Two hours on camera - a double feature, and you're the entire cast." },
  { from: 180, line: "Three hours. That's a director's cut, and it's all you. This is what practice looks like." },
  { from: 300, line: "Five hours in front of a lens. At this point the camera is just another person in the room." },
];

export function praiseFor(minutes: number): string | null {
  let line: string | null = null;
  for (const t of TIERS) if (minutes >= t.from) line = t.line;
  return line;
}

/** "45 minutes", "1 hour", "1 hour 20 minutes". */
export function spokenLength(minutes: number): { value: string; unit: string } {
  if (minutes < 60) return { value: String(minutes), unit: minutes === 1 ? "minute" : "minutes" };
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return { value: String(h), unit: h === 1 ? "hour" : "hours" };
  return { value: `${h}h ${m}`, unit: "minutes" };
}

export function SpeakingTime({ minutes }: { minutes: number }) {
  if (minutes <= 0) return null;
  const { value, unit } = spokenLength(minutes);
  const praise = praiseFor(minutes);
  // The seven colors, left to right across the figure.
  const stops = categories.map((c) => `var(--color-${c.id})`).join(", ");

  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-navy-600 bg-navy-900/50 px-4 py-5 text-center">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
        Speaking practiced and uploaded
      </span>
      <span
        className="text-6xl font-black leading-none tracking-tight tabular-nums sm:text-7xl"
        style={{
          background: `linear-gradient(100deg, ${stops})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          // A shadow behind the letters, since the letters have no
          // color of their own to throw one.
          filter: "drop-shadow(0 0 26px rgba(255,255,255,0.12))",
        }}
      >
        {value}
      </span>
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-muted">{unit}</span>
      {praise && <p className="max-w-sm pt-2 text-sm text-ink-muted text-balance">{praise}</p>}
    </div>
  );
}
