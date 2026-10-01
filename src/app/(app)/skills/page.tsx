import type { Metadata } from "next";
import { InfoEye } from "@/components/info-eye";
import { SkillsBrowser } from "@/components/skills-browser";
import { SectionTabs } from "@/components/section-tabs";
import { SectionTour } from "@/components/section-tour";
import { FeatureReaction } from "@/components/feature-reaction";

export const metadata: Metadata = {
  title: "Skills",
};

// The dial (or the grid, if that is where the student left the
// switch - see skills-browser.tsx) is the page. What the section is gets one line behind a
// chevron beside its name - a paragraph a student reads once and then
// scrolls past every day afterwards is not worth the top of the
// screen.

export default function SkillsPage() {
  return (
    <div className="flex flex-col gap-3 pb-10 pt-1">
      {/* The tabs are the heading - see section-tabs.tsx. */}
      <h1 className="sr-only">Skills</h1>
      <SectionTabs
        info={
          <InfoEye label="What Skills is">
            <p>
              Short, focused lessons - one to two minutes each - across the eight colors of dynamic speaking. Dip in;
              don&apos;t binge.
            </p>
          </InfoEye>
        }
      />
      <SectionTour section="skills" />

      <SkillsBrowser />
      <FeatureReaction feature="dial" label="the dial" />
    </div>
  );
}
