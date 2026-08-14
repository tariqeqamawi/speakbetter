import type { Metadata } from "next";
import DashboardPage from "@/app/(app)/profile/page";

// The dashboard with a worked-in student behind it, for seeing what it
// looks like full rather than empty. StoreProvider serves this route an
// ephemeral store seeded with sample data (see lib/demo-state), so
// nothing here reads or writes real progress.

export const metadata: Metadata = {
  title: "Dashboard preview",
  robots: { index: false, follow: false },
};

export default function DemoDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-navy-600 bg-navy-800 px-4 py-2.5 text-xs text-ink-muted">
        Preview — sample data, shown so the dashboard has something in it.
        Nothing here is yours, and nothing you click changes your progress.
      </p>
      <DashboardPage />
    </div>
  );
}
