import type { Metadata } from "next";
import { ChevronDownIcon } from "@/components/icons";
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
      <SectionTabs />
      <SectionTour section="skills" />

      {/* "What this is" shares its row with the small Dial / Grid
          switch (skills-browser.tsx). */}
      <SkillsBrowser>
        <details className="group -mt-1">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-ink-faint transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            What this is
            <ChevronDownIcon className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <p className="max-w-lg pt-2 text-sm text-ink-muted">
            Short, focused lessons - one to two minutes each - across the eight colors of dynamic speaking. Dip in;
            don&apos;t binge.
          </p>
        </details>
      </SkillsBrowser>
      <FeatureReaction feature="dial" label="the dial" />
    </div>
  );
}
