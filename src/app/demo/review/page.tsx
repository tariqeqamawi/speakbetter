import type { Metadata } from "next";
import { DemoFrame } from "@/components/demo-frame";
import { SampleReview } from "@/components/sample-review";

// A review, for its own sake: the coach's feedback on a sample take,
// laid out exactly as the challenge page shows it, with the row at the
// top that tries the three looks for its sections. For choosing between
// them without recording anything. /demo routes get the worked-in
// student's ephemeral store (see lib/demo-state), so nothing here reads
// or writes real progress.

export const metadata: Metadata = {
  title: "Review preview",
  robots: { index: false, follow: false },
};

export default async function DemoReviewPage(props: { searchParams: Promise<{ bare?: string }> }) {
  const { bare } = await props.searchParams;
  return (
    <DemoFrame bare={bare === "1"}>
      <SampleReview />
    </DemoFrame>
  );
}
