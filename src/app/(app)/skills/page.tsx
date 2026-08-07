import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";

export const metadata: Metadata = {
  title: "Skills",
};

export default function SkillsPage() {
  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Skills</h1>
        <p className="max-w-lg text-ink-muted">
          Short, focused lessons — one to two minutes each — across the seven
          colors of dynamic speaking. Dip in; don&apos;t binge.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => {
          const count = lessonsInCategory(cat.id).length;
          return (
            <li key={cat.id}>
              <Link
                href={`/skills/${cat.id}`}
                className="group flex h-full flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4 transition-colors hover:border-navy-950 hover:bg-navy-700"
              >
                <div className={`h-1 w-10 rounded-full ${cat.bgClass}`} />
                <span className="font-semibold text-ink">{cat.name}</span>
                <span className="text-sm text-ink-muted">{cat.blurb}</span>
                <span className="mt-auto pt-1 text-xs text-ink-faint">
                  {count} lessons
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
