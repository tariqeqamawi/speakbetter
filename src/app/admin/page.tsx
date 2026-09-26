import type { Metadata } from "next";
import { InsightsDashboard } from "@/components/admin/insights-dashboard";

export const metadata: Metadata = {
  title: "Cohort insights",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <InsightsDashboard />;
}
