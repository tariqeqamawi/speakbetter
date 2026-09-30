"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories, type Category } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { SkillDial } from "@/components/skill-dial";
import { VideoStill } from "@/components/video-still";
import { CategoryIcon } from "@/components/category-icons";
import { useStore } from "@/lib/store";
import { setSkillsView, useSkillsView, type SkillsView } from "@/lib/skills-view";

// Skills, two ways: the dial, or the grid. A switch at the top flips
// between them and stays where it is left (skills-view.ts).

/** Each colour's face in the grid: a lesson that shows what the colour
 *  is about, rather than simply its first. Any id not found falls back
 *  to the colour's first lesson. */
const FACE: Partial<Record<Category["id"], string>> = {
  storytelling: "1081031902",
  figurative: "1081032328",
  acting: "1081162875",
  voice: "1081162033",
  structure: "1080648113",
  mindset: "1081029780",
  "body-language": "1080653314",
  advanced: "1081161658",
};

function faceOf(cat: Category): string {
  const lessons = lessonsInCategory(cat.id);
  const wanted = FACE[cat.id];
  return (wanted && lessons.find((l) => l.vimeoId === wanted)?.vimeoId) || lessons[0].vimeoId;
}

export function SkillsBrowser() {
  const view = useSkillsView();
  return (
    <div className="flex flex-col gap-3">
      <ViewSwitch view={view} />
      {view === "grid" ? <SkillGrid /> : <SkillDial />}
    </div>
  );
}

function ViewSwitch({ view }: { view: SkillsView }) {
  const options: { id: SkillsView; label: string }[] = [
    { id: "dial", label: "Dial" },
    { id: "grid", label: "Grid" },
  ];
  return (
    <div role="radiogroup" aria-label="Show skills as" className="flex self-center rounded-full border border-navy-600 bg-navy-900/60 p-1">
      {options.map((o) => {
        const on = view === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setSkillsView(o.id)}
            className={`min-h-9 rounded-full px-5 text-sm font-semibold transition-colors ${
              on ? "bg-ink text-navy-950" : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The eight colours, one under another: a lesson from each as its
 *  face, its name, and how many of its lessons you have watched. */
function SkillGrid() {
  const prefix = usePathname().startsWith("/demo") ? "/demo" : "";
  const { state, ready } = useStore();
  return (
    <ul className="flex flex-col gap-3">
      {categories.map((cat, i) => {
        const lessons = lessonsInCategory(cat.id);
        const watched = ready ? lessons.filter((l) => state.watchedLessons.includes(l.vimeoId)).length : 0;
        return (
          <li key={cat.id} className="challenge-enter" style={{ animationDelay: `${i * 40}ms` }}>
            <Link
              href={`${prefix}/skills/${cat.id}`}
              className={`lift-card group flex items-center gap-3 overflow-hidden rounded-xl border border-navy-600 bg-navy-900/60 pr-3 transition-colors hover:border-current ${cat.textClass}`}
            >
              <span className={`w-1 self-stretch ${cat.bgClass}`} />
              <span className="relative my-2 block aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 sm:w-40">
                <VideoStill vimeoId={faceOf(cat)} accent={cat} sizes="160px" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-2">
                <span className="flex items-center gap-1.5">
                  <CategoryIcon category={cat.id} className="size-4" />
                  <span className="text-base font-semibold text-ink">{cat.name}</span>
                </span>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">{cat.subtitle}</span>
                <span className="text-xs tabular-nums text-ink-muted">
                  {lessons.length} lessons{watched > 0 ? ` · ${watched} watched` : ""}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
