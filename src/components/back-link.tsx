"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Back navigation with a real touch target. The negative margins keep
// the text visually flush with the content above it while the padding
// gives thumbs something to hit.
//
// Inside the /demo preview, going "back" stays inside the preview - the
// real routes are gated and would bounce a visitor to the sales page.

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  const inDemo = usePathname().startsWith("/demo");
  const target = inDemo && !href.startsWith("/demo") ? `/demo${href}` : href;
  return (
    <Link
      href={target}
      className="-mx-2 -my-1.5 inline-flex w-fit items-center gap-1.5 px-2 py-2.5 text-sm text-ink-faint transition-colors hover:text-ink-muted"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
        aria-hidden
      >
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
      {children}
    </Link>
  );
}
