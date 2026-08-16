"use client";

import { useEffect } from "react";
import { STORAGE_KEY } from "@/lib/store";
import { demoState } from "@/lib/demo-state";

// Seeds the sample student into this browser's real storage, then drops
// into the app proper - so the whole thing (Today, dashboard, the map)
// can be walked through populated instead of empty. Replaces whatever
// progress the browser held, which is why nothing links here except the
// preview surfaces.

export default function TryPage() {
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState));
    // A full navigation, not a client route: the store hydrates from
    // storage on load, and the seed has to be there first.
    window.location.replace("/");
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div className="spectrum-rule h-1 w-16 rounded-full" />
      <p className="text-sm text-ink-muted">Setting up the sample student…</p>
    </div>
  );
}
