import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { LessonCarousel } from "@/components/lesson-carousel";

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
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <BackLink href="/skills">Skills</BackLink>
        <div className={`h-1 w-14 rounded-full ${cat.bgClass}`} />
        <h1 className="text-3xl font-semibold tracking-tight">{cat.name}</h1>
        <p className="max-w-lg text-ink-muted">{cat.blurb}</p>
        <p className="text-xs text-ink-faint">
          {lessons.length} lessons · one to two minutes each
        </p>
      </header>

      <LessonCarousel lessons={lessons} category={cat} />
    </div>
  );
}
