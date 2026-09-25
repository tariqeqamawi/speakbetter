import type { Metadata } from "next";
import { badgeDefs, trophyArt } from "@/data/badges";
import { TrophyArt } from "@/components/trophy-art";

// Every badge in the course, shown won. The dashboard's trophy case
// shows what you haven't earned as a silhouette; this page is the
// opposite - the full set, so the whole collection can be seen at once
// (and reviewed while it's being designed). Reads from the same badge
// list, so it can never drift out of date. The rendered trophies, the
// same ones the case holds, rather than the drawn medallions they
// replaced.

export const metadata: Metadata = {
  title: "Badges",
  description: "Every badge in Speak Better.",
  robots: { index: false, follow: false },
};

export default function BadgeGalleryPage() {
  return (
    <div className="flex flex-col gap-8 py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="spectrum-rule h-1 w-16 rounded-full" />
        <h1 className="text-3xl font-semibold tracking-tight">
          Every badge in the course
        </h1>
        <p className="max-w-lg text-ink-muted">
          {badgeDefs.length} of them. Some for showing up, some for streaks,
          some for a specific thing done well - and one for every challenge on
          the STORY adventure.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badgeDefs.map((badge) => (
          <li
            key={badge.id}
            className="flex items-center gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-4"
          >
            <TrophyArt
              src={trophyArt(badge.id).image}
              won
              lazy
              className="h-24 shrink-0"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink">
                {badge.title}
              </span>
              <span className="text-xs leading-relaxed text-ink-muted">
                {badge.message}
              </span>
              <span className="text-[0.7rem] leading-snug text-ink-faint">
                {badge.how ?? "Hidden achievement - no hints for this one."}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
