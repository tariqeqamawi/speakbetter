import { SUPPORT_EMAIL } from "./support";

// The website around the app: the pages a visitor reads before (or
// instead of) joining. One list, so the header, the footer and the
// sitemap can't disagree about what exists.

export interface SitePage {
  href: string;
  label: string;
}

/** In the header, in this order. */
export const SITE_NAV: SitePage[] = [
  { href: "/landing", label: "Speak Better App" },
  { href: "/mentorship", label: "Work with Me" },
  { href: "/about", label: "About" },
  { href: "/book", label: "The Book" },
  { href: "/deck", label: "The Deck" },
  { href: "/teams", label: "Teams" },
  { href: "/contact", label: "Contact" },
];

/** In the footer: everything, the quieter pages included. */
export const SITE_FOOTER: SitePage[] = [
  ...SITE_NAV,
  { href: "/partnerships", label: "Partnerships" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

/** Every page that wears the website's header rather than the app's. */
export const SITE_PATHS = [...new Set(["/landing", ...SITE_FOOTER.map((p) => p.href)])];

/**
 * A "Talk to us" that opens the visitor's own email, addressed and with
 * the subject and a few prompts already in - so the first message that
 * arrives has what's needed to reply properly. (Until there's a form
 * that sends from the page itself: that needs an email service.)
 */
export function talkMailto(subject: string, prompts: string[] = []): string {
  const body = prompts.length ? `${prompts.map((p) => `${p}: `).join("\n")}\n\n` : "";
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Speak Better - ${subject}`)}${
    body ? `&body=${encodeURIComponent(body)}` : ""
  }`;
}
