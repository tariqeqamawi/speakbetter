"use client";

import Image from "next/image";
import { useState } from "react";
import { challengesInPhase, storyPhases, type PhaseId } from "@/data/challenges";

// The STORY journey on the landing page, opened up. A visitor shouldn't
// have to buy the course to find out what's in it — hovering (or tapping,
// or tabbing to) a letter shows every challenge in that phase, with the
// still from its own explainer video.

export function StoryPreview() {
  const [active, setActive] = useState<PhaseId>("S");
  const phase = storyPhases.find((p) => p.id === active) ?? storyPhases[0];
  const challenges = challengesInPhase(active);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      {/* The panel sits above the letters and keeps a fixed height, so
          moving between phases swaps the contents without the page
          jumping under the pointer. */}
      <div
        className={`flex min-h-[13.5rem] flex-col gap-3 rounded-2xl border bg-navy-800/60 p-4 sm:min-h-[12rem] ${phase.borderClass}`}
      >
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-bold ${phase.textClass}`}>
            {phase.id}
          </span>
          <h3 className="text-sm font-semibold text-ink">{phase.name}</h3>
          <span className="ml-auto text-xs text-ink-faint">
            {challenges.length} challenges
          </span>
        </div>
        <p className="text-xs text-ink-muted">{phase.tagline}</p>
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {challenges.map((challenge) => (
            <li
              key={challenge.slug}
              className="flex w-32 shrink-0 flex-col gap-1.5 sm:w-36"
            >
              <div className="relative aspect-video overflow-hidden rounded-lg bg-navy-950">
                {challenge.vimeoId ? (
                  <Image
                    src={`/thumbs/${challenge.vimeoId}.jpg`}
                    alt=""
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : (
                  <span className={`absolute inset-0 ${phase.tintClass}`} />
                )}
                <span
                  className={`absolute inset-x-0 bottom-0 h-0.5 ${phase.bgClass}`}
                />
              </div>
              <span className="text-[0.7rem] leading-snug text-ink-muted">
                {challenge.title}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ol className="grid w-full gap-3 sm:grid-cols-5">
        {storyPhases.map((p) => {
          const selected = p.id === active;
          return (
            <li key={p.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(p.id)}
                onFocus={() => setActive(p.id)}
                onClick={() => setActive(p.id)}
                aria-pressed={selected}
                className={`flex w-full flex-col items-center gap-1 rounded-xl border p-4 text-center transition-[transform,opacity] ${p.borderClass} ${p.tintClass} ${
                  selected ? "scale-[1.03]" : "opacity-70 hover:opacity-100"
                }`}
              >
                <span className="text-xl font-bold text-ink">{p.id}</span>
                <span className="text-xs font-medium text-ink-muted">
                  {p.name}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
