import type { Metadata } from "next";
import ChallengesPage from "@/app/(app)/challenges/page";
import { DemoFrame } from "@/components/demo-frame";

export const metadata: Metadata = {
  title: "Challenges preview",
  robots: { index: false, follow: false },
};

export default async function DemoChallengesPage(props: { searchParams: Promise<{ bare?: string }> }) {
  const { bare } = await props.searchParams;
  return (
    <DemoFrame bare={bare === "1"}>
      <ChallengesPage />
    </DemoFrame>
  );
}
