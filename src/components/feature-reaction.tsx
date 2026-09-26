"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/insights";

// One quiet line under each main part of the app - the road, the dial,
// the deck, the dashboard, the trophies, Ask Coach: 🔥 if it's working
// for you, 👇 if it isn't, and on 👇 one optional line on why. A student's
// answer is remembered on the device, so it's asked once, not every visit
// (tapping the other one changes it).

export type Feature = "road" | "dial" | "deck" | "dashboard" | "trophies" | "ask-coach";

const KEY = "feature-reactions-v1";

function load(): Record<string, "love" | "dislike"> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function FeatureReaction({ feature, label }: { feature: Feature; label: string }) {
  const [mine, setMine] = useState<"love" | "dislike" | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- read the device's answer after hydration
  useEffect(() => setMine(load()[feature] ?? null), [feature]);

  const react = (r: "love" | "dislike") => {
    setMine(r);
    setSent(false);
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...load(), [feature]: r }));
    } catch {}
    track({ type: "feature-reaction", feature, reaction: r });
  };
  const send = () => {
    if (!note.trim()) return;
    track({ type: "feature-reaction", feature, reaction: "dislike", note: note.trim() });
    setSent(true);
  };

  const pill = (r: "love" | "dislike", emoji: string, title: string) => (
    <button
      type="button"
      onClick={() => react(r)}
      aria-pressed={mine === r}
      title={title}
      className={`rounded-full border px-2.5 py-1 text-base leading-none transition-colors ${
        mine === r ? "border-ink-faint bg-navy-700" : "border-navy-600 opacity-70 hover:opacity-100"
      }`}
    >
      {emoji}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-2 py-2 text-xs text-ink-faint">
      <div className="flex items-center gap-2">
        <span>{mine ? "Thanks - noted." : `How's ${label} working for you?`}</span>
        {pill("love", "🔥", "Love it")}
        {pill("dislike", "👇", "Not for me")}
      </div>
      {mine === "dislike" && !sent && (
        <div className="flex w-full max-w-sm gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            placeholder="What would make it better? (optional)"
            aria-label={`What would make ${label} better?`}
            className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-900 px-3 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!note.trim()}
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-navy-900 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
