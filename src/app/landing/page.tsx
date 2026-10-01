import type { Metadata } from "next";
import { LandingV } from "@/components/landing-v";

// Preview route: always the visitor's landing page, no matter what
// progress is saved in this browser. StoreProvider serves an ephemeral
// store on this path, so nothing here reads or writes real progress -
// even clicking Unlock leaves saved state untouched.

export const metadata: Metadata = {
  title: "Landing preview",
  robots: { index: false, follow: false },
};

export default function LandingPreviewPage() {
  return <LandingV variant="b" />;
}
