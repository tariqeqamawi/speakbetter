import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills",
};

export default function SkillsPage() {
  return (
    <div className="flex flex-col gap-3 py-6">
      <h1 className="text-3xl font-semibold tracking-tight">Skills</h1>
      <p className="max-w-lg text-ink-muted">
        Around 80 short lessons — one to two minutes each — organized into
        seven color-coded categories. The library and the digital card deck
        arrive in Phase 1.
      </p>
    </div>
  );
}
