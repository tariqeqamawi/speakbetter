import type { Metadata } from "next";
import { LandingTest } from "@/components/landing-test";

// The landing page being pared back, beside the live one at "/" until it
// replaces it. Like /landing, it runs on a throwaway store.

export const metadata: Metadata = {
  title: "Speak Better",
  robots: { index: false, follow: false },
};

export default function LandingTestPage() {
  return <LandingTest />;
}
