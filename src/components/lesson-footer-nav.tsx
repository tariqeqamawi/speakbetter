"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { challengeBySlug } from "@/data/challenges";

// What a student does after a lesson depends on why they opened it.
// Arriving from a challenge's warm-up (?from=<slug>) means the lesson
// was a detour — so send them back to the challenge rather than deeper
// into the library.

export function LessonFooterNav({
  nextHref,
  nextTitle,
}: {
  nextHref?: string;
  nextTitle?: string;
}) {
  const params = useSearchParams();
  const from = params.get("from");
  const challenge = from ? challengeBySlug.get(from) : undefined;

  if (challenge) {
    return (
      <Link
        href={`/challenges/${challenge.slug}`}
        className="flex min-h-11 w-fit items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
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
        Back to the challenge
      </Link>
    );
  }

  if (!nextHref || !nextTitle) return null;

  return (
    <Link
      href={nextHref}
      className="flex min-h-11 w-fit items-center rounded-lg border border-navy-600 px-4 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
    >
      Next lesson: {nextTitle} →
    </Link>
  );
}
