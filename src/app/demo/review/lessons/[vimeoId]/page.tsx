import type { Metadata } from "next";
import { DemoFrame } from "@/components/demo-frame";
import { SampleReviewLesson } from "@/components/sample-review";

// A lesson opened from the sample review (/demo/review): the same
// page a student gets from a real one - only the review's lessons, why
// this one, and the way back.

export const metadata: Metadata = {
  title: "Review preview - a lesson",
  robots: { index: false, follow: false },
};

export default async function Page(props: { params: Promise<{ vimeoId: string }>; searchParams: Promise<{ bare?: string }> }) {
  const { vimeoId } = await props.params;
  const { bare } = await props.searchParams;
  return (
    <DemoFrame bare={bare === "1"}>
      <SampleReviewLesson vimeoId={vimeoId} />
    </DemoFrame>
  );
}
