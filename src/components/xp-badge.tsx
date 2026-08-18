import { ZapIcon } from "@/components/icons";

// What a thing is worth, said before it's done.
//
// The XP receipt already existed for the moment after - watch a lesson
// and it tells you what you earned. This is the same number shown
// beforehand, on the thing itself, so a student can see what a lesson or
// a challenge is worth while deciding whether to start it.
//
// Two sizes and no color of its own: the badge takes the color of
// whatever it's placed on, so it reads as part of that card rather than
// as a sticker applied to it. Challenges are worth several times what
// lessons are, and the numbers say so without the badge having to shout.

export function XpBadge({
  xp,
  size = "sm",
  className = "",
}: {
  xp: number;
  /** `sm` sits on a card corner; `md` sits in a heading. */
  size?: "sm" | "md";
  className?: string;
}) {
  const small = size === "sm";
  return (
    <span
      title={`Worth ${xp} XP`}
      className={`inline-flex items-center gap-1 rounded-full font-bold tabular-nums ${
        small
          ? "px-1.5 py-0.5 text-[0.6rem]"
          : "px-2.5 py-1 text-xs"
      } ${className}`}
    >
      <ZapIcon className={small ? "size-3" : "size-3.5"} />
      {xp}
      <span className={small ? "sr-only" : ""}>XP</span>
    </span>
  );
}
