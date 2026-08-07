import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryById, type CategoryId } from "@/data/categories";
import { lessons, lessonByVimeoId } from "@/data/lessons";
import { getTranscript } from "@/lib/transcripts";
import { VimeoPlayer } from "@/components/vimeo-player";
import { LessonWatched } from "@/components/lesson-watched";

export function generateStaticParams() {
  return lessons.map((l) => ({ category: l.category, vimeoId: l.vimeoId }));
}

export async function generateMetadata(props: PageProps<"/skills/[category]/[vimeoId]">) {
  const { vimeoId } = await props.params;
  const lesson = lessonByVimeoId.get(vimeoId);
  return { title: lesson ? lesson.title : "Lesson" };
}

export default async function LessonPage(props: PageProps<"/skills/[category]/[vimeoId]">) {
  const { vimeoId } = await props.params;
  const lesson = lessonByVimeoId.get(vimeoId);
  if (!lesson) notFound();

  const cat = categoryById.get(lesson.category as CategoryId)!;
  const transcript = getTranscript(lesson.vimeoId);
  const siblings = lessons.filter((l) => l.category === lesson.category);
  const index = siblings.findIndex((l) => l.vimeoId === lesson.vimeoId);
  const next = siblings[index + 1];

  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/skills/${cat.id}`}
          className="text-sm text-ink-faint hover:text-ink-muted"
        >
          ← {cat.name}
        </Link>
        <div className={`h-1 w-14 rounded-full ${cat.bgClass}`} />
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {lesson.title}
        </h1>
      </header>

      <VimeoPlayer vimeoId={lesson.vimeoId} title={lesson.title} />
      <LessonWatched vimeoId={lesson.vimeoId} />

      {transcript && (
        <details className="group rounded-xl border border-navy-600 bg-navy-800">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            Transcript
          </summary>
          <p className="max-w-prose whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-ink-muted">
            {transcript}
          </p>
        </details>
      )}

      {next && (
        <Link
          href={`/skills/${cat.id}/${next.vimeoId}`}
          className="self-start rounded-lg border border-navy-600 px-4 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          Next lesson: {next.title} →
        </Link>
      )}
    </div>
  );
}
