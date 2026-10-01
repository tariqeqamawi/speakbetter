import { notFound } from "next/navigation";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { CategoryTheater } from "@/components/category-theater";
import { FeatureReaction } from "@/components/feature-reaction";

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
    <div className="flex flex-col gap-6 pb-6 pt-2">
      <CategoryTheater category={cat} lessons={lessons} />
      <FeatureReaction feature="lessons" label="the lessons" />
    </div>
  );
}
