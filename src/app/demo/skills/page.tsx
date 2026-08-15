import type { Metadata } from "next";
import SkillsPage from "@/app/(app)/skills/page";
import { DemoFrame } from "@/components/demo-frame";

export const metadata: Metadata = {
  title: "Skills preview",
  robots: { index: false, follow: false },
};

export default function DemoSkillsPage() {
  return (
    <DemoFrame>
      <SkillsPage />
    </DemoFrame>
  );
}
