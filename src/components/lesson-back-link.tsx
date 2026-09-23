"use client";

import { useSearchParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { challengeBySlug } from "@/data/challenges";

// Where "back" goes from a lesson depends on why the lesson was
// opened.
//
// Opened from the library, back is the color it belongs to. Opened
// from a challenge's warm-up (?from=<slug>), the lesson was a detour
// and back is that challenge - anything else drops a student out of
// the thing they were in the middle of doing, which is the one place
// a back button must never send anybody.
//
// The footer has said this for a while; the link at the top of the
// page did not, and the top one is the one a thumb reaches for.

export function LessonBackLink({
  categoryHref,
  categoryName,
}: {
  categoryHref: string;
  categoryName: string;
}) {
  const params = useSearchParams();
  const from = params.get("from");
  const challenge = from ? challengeBySlug.get(from) : undefined;

  if (challenge) return <BackLink href={`/challenges/${challenge.slug}`}>{challenge.title}</BackLink>;
  return <BackLink href={categoryHref}>{categoryName}</BackLink>;
}
