import type { Metadata } from "next";
import DashboardPage from "@/app/(app)/profile/page";
import { DemoFrame } from "@/components/demo-frame";

// The dashboard with a worked-in student behind it, for seeing what it
// looks like full rather than empty. StoreProvider serves every /demo
// route an ephemeral store seeded with sample data (see lib/demo-state),
// so nothing here reads or writes real progress.

export const metadata: Metadata = {
  title: "Dashboard preview",
  robots: { index: false, follow: false },
};

export default function DemoDashboardPage() {
  return (
    <DemoFrame>
      <DashboardPage />
    </DemoFrame>
  );
}
