import type { Metadata } from "next";
import { ChevronDownIcon, SkillsIcon } from "@/components/icons";
import { SkillDial } from "@/components/skill-dial";
import { SectionTabs } from "@/components/section-tabs";
import { SectionTour } from "@/components/section-tour";

export const metadata: Metadata = {
  title: "Skills",
};

// The dial is the page. What the section is gets one line behind a
// chevron beside its name - a paragraph a student reads once and then
// scrolls past every day afterwards is not worth the top of the
// screen.

export default function SkillsPage() {
  return (
    <div className="flex flex-col gap-3 pb-10 pt-4">
      <header>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
            {/* The section's own icon travels with its name, the way it
                does in the navigation and on the dashboard. */}
            <SkillsIcon className="size-7 shrink-0 text-storytelling" />
            <h1 className="text-3xl font-semibold tracking-tight">Skills</h1>
            <ChevronDownIcon className="size-5 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
            <span className="ml-auto">
              <SectionTour section="skills" />
            </span>
          </summary>
          <p className="max-w-lg pt-2 text-sm text-ink-muted">
            Short, focused lessons - one to two minutes each - across the seven colors of dynamic speaking. Dip in;
            don&apos;t binge.
          </p>
        </details>
      </header>

      <SectionTabs />
      <SkillDial />
    </div>
  );
}
