import { notFound } from "next/navigation";
import { Suspense } from "react";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { CategoryTheater } from "@/components/category-theater";
import { FeatureReaction } from "@/components/feature-reaction";
import { SkillsGate } from "@/components/skills-gate";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata(props: PageProps<"/skills/[category]">) {
  const { category } = await props.params;
  const cat = categoryById.get(category as CategoryId);
  return { title: cat ? cat.name : "Skills" };
}

export default async function CategoryPage(props: PageProps<"/skills/[category]">) {
  const { category } = await props.params;
  const cat = categoryById.get(category as CategoryId);
  if (!cat) notFound();

  const lessons = lessonsInCategory(cat.id);

  return (
    <div className="flex flex-col gap-6 pb-6">
      <SkillsGate category={cat.id} />
      {/* (Reads the address - ?lesson=, ?spread= - so it renders in the
          browser, inside its own boundary.) */}
      <Suspense fallback={<div className="min-h-[70vh]" aria-busy />}>
        <CategoryTheater category={cat} lessons={lessons} />
      </Suspense>
      <FeatureReaction feature="lessons" label="the lessons" />
    </div>
  );
}
