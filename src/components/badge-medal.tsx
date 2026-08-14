import Image from "next/image";
import { BadgeIcon } from "@/components/icons";

// A badge's artwork: a generated medallion, clipped to its circle so the
// black plate it was drawn on never shows as a square tile. Locked ones
// are the same medal drained of colour and dimmed — you can see exactly
// what you haven't won yet, which is the whole point of showing it.
//
// The line icon stays as the fallback for any badge without art, and is
// what the inline celebration toast uses.

export function BadgeMedal({
  id,
  icon,
  earned,
  className = "size-16",
}: {
  id: string;
  icon: string;
  earned: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full ${className}`}
    >
      <Image
        src={`/badges/${id}.png`}
        alt=""
        fill
        sizes="96px"
        className={`object-cover transition-[filter,opacity] duration-300 ${
          earned ? "" : "opacity-35 grayscale"
        }`}
      />
      {/* Sits under the art, so a missing file leaves the line icon
          visible rather than an empty hole. */}
      <span className="absolute inset-0 -z-10 flex items-center justify-center">
        <BadgeIcon
          name={icon}
          className={`size-6 ${earned ? "text-storytelling" : "text-navy-600"}`}
        />
      </span>
    </span>
  );
}
