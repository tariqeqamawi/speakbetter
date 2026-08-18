import type { Metadata } from "next";
import { SkillsIcon } from "@/components/icons";
import { SkillDial } from "@/components/skill-dial";
import { SectionTabs } from "@/components/section-tabs";

export const metadata: Metadata = {
  title: "Skills",
};

export default function SkillsPage() {
  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        {/* The section's own icon travels with its name, the way it does
            in the navigation and on the dashboard. */}
        <h1 className="flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
          <SkillsIcon className="size-7 shrink-0 text-storytelling" />
          Skills
        </h1>
        <p className="max-w-lg text-ink-muted">
          Short, focused lessons - one to two minutes each - across the seven
          colors of dynamic speaking. Dip in; don&apos;t binge.
        </p>
      </header>

      <SectionTabs />
      <SkillDial />
    </div>
  );
}
