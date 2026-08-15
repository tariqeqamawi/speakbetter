import type { Metadata } from "next";
import ChallengesPage from "@/app/(app)/challenges/page";
import { DemoFrame } from "@/components/demo-frame";

export const metadata: Metadata = {
  title: "Challenges preview",
  robots: { index: false, follow: false },
};

export default function DemoChallengesPage() {
  return (
    <DemoFrame>
      <ChallengesPage />
    </DemoFrame>
  );
}
