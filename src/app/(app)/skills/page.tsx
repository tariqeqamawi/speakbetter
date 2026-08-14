import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { categories } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { CategoryIcon } from "@/components/category-icons";
import stills from "@/data/category-stills.json";

export const metadata: Metadata = {
  title: "Skills",
};

const categoryStills = stills as Record<string, string | null>;

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

      <ul className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat) => {
          const count = lessonsInCategory(cat.id).length;
          const still = categoryStills[cat.id];
          return (
            <li key={cat.id}>
              <Link
                href={`/skills/${cat.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-navy-600 bg-navy-800 transition-colors hover:border-ink-faint"
              >
                {/* the category's lion, and a frame from one of its lessons */}
                <div className="flex h-24 shrink-0 items-stretch bg-gradient-to-br from-navy-700 to-navy-900 sm:h-28">
                  <div className="flex w-[38%] shrink-0 items-center justify-center px-3">
                    <Image
                      src={`/cat-${cat.id}.png`}
                      alt=""
                      width={275}
                      height={220}
                      className="h-full w-auto max-h-16 object-contain sm:max-h-20"
                    />
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    {still ? (
                      <Image
                        src={`/thumbs/${still}.jpg`}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 300px, 60vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className={`absolute inset-0 ${cat.bgClass} opacity-20`} />
                    )}
                    {/* fade the still into the lion's side so the two read as one band */}
                    <span className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-navy-950 to-transparent" />
                  </div>
                </div>

                <div className={`h-1 shrink-0 ${cat.bgClass}`} />

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="flex items-center gap-2">
                    <CategoryIcon
                      category={cat.id}
                      className={`size-5 shrink-0 ${cat.textClass}`}
                    />
                    <span className="font-semibold text-ink">{cat.name}</span>
                  </span>
                  <span className="text-sm text-ink-muted">{cat.blurb}</span>
                  <span className="mt-auto pt-1 text-xs text-ink-faint">
                    {count} lessons
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
