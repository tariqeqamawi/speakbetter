"use client";

import { useEffect } from "react";

// A page opened with ?bare=1 is a preview inside a phone frame on the
// landing page (see landing-showcase.tsx). It marks the document so the
// stylesheet can still the ambient animations - the previews are there
// to be looked at, not to breathe, and four of them breathing at once
// cost the page that holds them its frame rate.

const KEY = "speak-better-bare";

/** Whether this document is a bare preview - for JS-driven motion. It
 *  sticks for the tab once asked for, so a page reached from a preview
 *  (a lesson opened from the dial) stays bare too. */
export function isBare(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("bare") === "1") {
      window.sessionStorage.setItem(KEY, "1");
      return true;
    }
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function BareMode() {
  useEffect(() => {
    if (isBare()) document.documentElement.classList.add("bare");
  }, []);
  return null;
}
