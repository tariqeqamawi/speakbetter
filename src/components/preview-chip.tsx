"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A door from the landing preview into the populated app. Only rendered
// on /landing - the preview surface - never on the real sales page at
// "/", where a visitor should meet the purchase flow, not a shortcut
// around it. /try overwrites this browser's saved progress with the
// sample student, so the door says so.

export function PreviewChip() {
  const onPreview = usePathname() === "/landing";
  if (!onPreview) return null;

  return (
    <Link
      href="/try"
      className="text-xs text-ink-faint underline decoration-navy-600 underline-offset-4 transition-colors hover:text-ink-muted"
      title="Loads sample data into this browser, replacing any saved progress"
    >
      Just reviewing? Walk through the app with sample data →
    </Link>
  );
}
