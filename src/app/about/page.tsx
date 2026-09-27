import type { Metadata } from "next";
import { OriginStory } from "@/components/origin-story";
import { JoinCta } from "@/components/join-cta";
import { SiteFooter } from "@/components/site/site-footer";

// How Speak Better came to be, on a page of its own - reached from
// "About" in the header of the sales page. The story is too long to sit
// in the middle of the pitch, and the people who want it go looking for
// it; at the end, the same door as the landing page, to the tiers.

export const metadata: Metadata = {
  title: "About",
  description: "The origin story of Speak Better, and the teacher behind it.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-14 py-10">
      <OriginStory />
      <JoinCta label="Join the founding cohort" href="/landing#pricing" price />
      <SiteFooter />
    </div>
  );
}
