"use client";

import { useEffect, useRef, useState } from "react";
import type { PhaseId } from "@/data/challenges";
import { StoryProgress } from "@/components/story-progress";
import { JourneyMap } from "@/components/journey-map";

// The progress bar and the map are the same journey seen twice: the bar
// is the overview, the map is the terrain. Clicking a color in the bar
// flies the map to that phase - and the bar rides along under the top
// banner while the map scrolls, dressing itself in a backdrop only once
// it's actually stuck, so it fades back into the page at the top.

export function StoryBoard() {
  const [selected, setSelected] = useState<PhaseId | null>(null);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A 1px sentinel just above the bar: when it leaves the viewport, the
  // bar is pinned and earns its backdrop.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const flyTo = (id: PhaseId) => {
    setSelected(id);
    document
      .getElementById(`journey-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        className={`sticky-under-header -mx-4 px-4 transition-all duration-300 ${
          stuck
            ? "border-b border-navy-700/70 bg-navy-900/90 py-2.5 shadow-lg shadow-navy-950/40 backdrop-blur"
            : "py-0"
        }`}
      >
        <StoryProgress open={selected ?? undefined} onOpen={flyTo} />
      </div>
      <JourneyMap />
    </div>
  );
}
