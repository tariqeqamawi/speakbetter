import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import { lessonsInCategory } from "@/data/lessons";
import { WatchedIndicator } from "@/components/watched-indicator";

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
      </header>

      <ul className="flex flex-col gap-2">
        {lessons.map((lesson, i) => (
          <li key={lesson.vimeoId}>
            <Link
              href={`/skills/${cat.id}/${lesson.vimeoId}`}
              className="flex items-center gap-3 rounded-lg border border-navy-600 bg-navy-800 px-4 py-3 transition-colors hover:bg-navy-700"
            >
              <span className="w-6 shrink-0 text-right text-sm tabular-nums text-ink-faint">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-ink">{lesson.title}</span>
              <WatchedIndicator vimeoId={lesson.vimeoId} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
