import type { Metadata } from "next";
import { LandingV } from "@/components/landing-v";

// Landing page, version A - for comparing (landing-v.tsx).

export const metadata: Metadata = {
  title: "Speak Better",
  robots: { index: false, follow: false },
};

export default function LandingPageA() {
  return <LandingV variant="a" />;
}
