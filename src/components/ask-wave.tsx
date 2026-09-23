"use client";

import { Soundwave } from "@/components/soundwave";
import { ListenIcon } from "@/components/icons";

// The Ask Coach button, which is the wave.
//
// The wave under the lion was the best-looking thing on the page and
// did nothing; the button under it was the most important thing on the
// page and looked like a button. So they are now one object: the mark's
// own ribbons, running edge to edge, with the words sitting on them.
//
// It also tells you where you are without saying it twice. The wave is
// calm and dim at rest, it stands up and runs bright while Coach is
// listening, and it swells wide and slow while he is thinking - so the
// half minute his voice takes to arrive looks like something happening
// rather than nothing happening.

export type AskPhase = "idle" | "listening" | "thinking" | "answering" | "failed";

const LABEL: Record<AskPhase, string> = {
  idle: "Ask Coach",
  failed: "Ask Coach",
  listening: "Listening",
  thinking: "Processing",
  answering: "Coach is answering",
};

export function AskWave({
  phase,
  onPress,
  disabled,
}: {
  phase: AskPhase;
  onPress: () => void;
  disabled: boolean;
}) {
  const live = phase === "listening";
  const busy = phase === "thinking" || phase === "answering";

  return (
    <button
      type="button"
      data-tour="ask"
      disabled={disabled}
      onClick={onPress}
      aria-label={LABEL[phase]}
      className={`ask-wave group relative block w-full select-none overflow-hidden rounded-[2rem] border transition-[transform,border-color] disabled:cursor-default ${
        live
          ? "scale-[1.02] border-acting/70"
          : busy
            ? "border-figurative/60"
            : "border-navy-600 hover:scale-[1.01] hover:border-ink-faint active:scale-[0.995]"
      }`}
      data-state={live ? "live" : busy ? "busy" : "rest"}
    >
      {/* The ribbons themselves, filling the button. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <Soundwave variant="coach" className="ask-wave-ribbons h-[190%] w-[130%]" />
      </span>

      {/* A pool of light under the words, so they stay readable over
          whatever colour is passing behind them. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(42% 110% at 50% 50%, rgba(8,13,26,0.8), rgba(8,13,26,0.2) 75%, transparent)" }}
      />

      <span className="relative flex min-h-[4.5rem] items-center justify-center gap-3 px-6">
        {live ? (
          <span aria-hidden className="flex items-end gap-[3px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="listening-bar w-[3px] rounded-full bg-acting"
                style={{ animationDelay: `${i * 140}ms` }}
              />
            ))}
          </span>
        ) : busy ? (
          <span aria-hidden className="ask-thinking-dot size-3 rounded-full bg-figurative" />
        ) : (
          <ListenIcon className="size-6 text-ink" />
        )}
        <span className={`text-lg font-bold tracking-tight ${live ? "text-acting" : busy ? "text-figurative" : "text-ink"}`}>
          {LABEL[phase]}
        </span>
      </span>
    </button>
  );
}
