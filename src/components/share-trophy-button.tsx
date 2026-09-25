"use client";

import { useState } from "react";
import { SendIcon } from "@/components/icons";
import type { StageTrophy } from "@/components/trophy-stage";
import { drawShareCard, shareOrDownload } from "@/lib/share-card";

// Share a won trophy as a picture (lib/share-card.ts draws it). The
// card is drawn when the button is pressed, not ahead of time - most
// trophies are never shared, and a 1080x1350 canvas per trophy on the
// screen would be a lot of work for nothing.

export function ShareTrophyButton({
  trophy,
  studentName,
  className = "",
}: {
  trophy: StageTrophy;
  studentName: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<string | null>(null);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    setSaid(null);
    try {
      const blob = await drawShareCard({
        trophyName: trophy.name,
        color: trophy.color,
        image: trophy.image,
        zoom: trophy.zoom,
        studentName,
        earnedAt: trophy.earnedAt,
        grand: trophy.grand,
      });
      if (!blob) throw new Error("no canvas");
      const how = await shareOrDownload(blob, `speak-better-${trophy.id}.png`, trophy.name);
      if (how === "downloaded") setSaid("Saved - ready to post.");
    } catch {
      setSaid("That didn't work - try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-navy-500 bg-navy-800 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink-faint disabled:opacity-60 ${className}`}
      >
        <SendIcon className="size-4" />
        {busy ? "Making the picture…" : "Share this trophy"}
      </button>
      <span aria-live="polite" className="text-xs text-ink-faint">
        {said}
      </span>
    </span>
  );
}
