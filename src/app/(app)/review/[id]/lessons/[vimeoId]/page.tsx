import type { Metadata } from "next";
import { ReviewLessonPage } from "@/components/review-lesson-page";

// A lesson named in a review, opened from the review: only the lessons
// Coach named in that review, the chosen one playing, and a way back to
// the review - not the library, where the review would be lost behind
// eighty other lessons.

export const metadata: Metadata = { title: "A lesson from your review" };

export default async function Page(props: PageProps<"/review/[id]/lessons/[vimeoId]">) {
  const { id, vimeoId } = await props.params;
  return <ReviewLessonPage id={id} vimeoId={vimeoId} />;
}
