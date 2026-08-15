import Image from "next/image";
import type { ComponentType, ReactNode } from "react";

// A wide plate at the top of a dashboard panel: the section's image,
// faded into the card so it reads as part of the surface rather than a
// picture stuck on it, with the section's own icon and title sitting on
// the bottom edge — the same stroke-only symbol family used everywhere
// else in the course.

export function SectionBanner({
  image,
  title,
  Icon,
  accentClass = "text-ink",
  right,
  /** Headline treatment: the title sits large beside its icon, for the
   *  panels where the section name is the headline rather than a label. */
  large = false,
}: {
  image: string;
  title: string;
  Icon: ComponentType<{ className?: string }>;
  accentClass?: string;
  right?: ReactNode;
  large?: boolean;
}) {
  return (
    <div
      className={`relative w-full shrink-0 overflow-hidden ${
        large ? "h-28 sm:h-32" : "h-24 sm:h-28"
      }`}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 1280px) 700px, 100vw"
        className="object-cover"
      />
      {/* The card color climbs back over the image, so type stays
          readable no matter how bright the art gets. */}
      <span className="absolute inset-0 bg-gradient-to-t from-navy-800 via-navy-800/75 to-navy-800/25" />
      <div
        className={`absolute inset-x-0 bottom-0 flex px-5 pb-3 ${
          large ? "items-center gap-3" : "items-center gap-2.5"
        }`}
      >
        <Icon
          className={`shrink-0 ${accentClass} ${large ? "size-8 sm:size-9" : "size-5"}`}
        />
        <h2
          className={
            large
              ? "text-3xl font-bold tracking-tight text-ink sm:text-4xl"
              : "text-sm font-semibold text-ink"
          }
        >
          {title}
        </h2>
        {right && <span className="ml-auto">{right}</span>}
      </div>
    </div>
  );
}
