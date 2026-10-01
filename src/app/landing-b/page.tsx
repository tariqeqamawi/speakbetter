import type { Metadata } from "next";
import { LandingV } from "@/components/landing-v";

// Landing page, version B - for comparing (landing-v.tsx). B adds a challenge to try, free.

export const metadata: Metadata = {
  title: "Speak Better",
  robots: { index: false, follow: false },
};

export default function LandingPageB() {
  return <LandingV variant="b" />;
}
