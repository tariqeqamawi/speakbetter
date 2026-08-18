import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { categoryById, type CategoryId } from "@/data/categories";
import { lessons, lessonByVimeoId } from "@/data/lessons";
import { getTranscript } from "@/lib/transcripts";
import { LessonPlayer } from "@/components/lesson-player";
import { XpBadge } from "@/components/xp-badge";
import { lessonXp } from "@/lib/progress";
import { LessonFooterNav } from "@/components/lesson-footer-nav";
import { Suspense } from "react";

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
        <BackLink href={`/skills/${cat.id}`}>{cat.name}</BackLink>
        <div className={`h-1 w-14 rounded-full ${cat.bgClass}`} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {lesson.title}
          </h1>
          {/* Longer lessons are worth more, so the number is the
              lesson's own rather than a constant repeated 121 times. */}
          <XpBadge
            xp={lessonXp(lesson.vimeoId)}
            size="md"
            className={`border border-navy-600 ${cat.textClass}`}
          />
        </div>
      </header>

      <LessonPlayer vimeoId={lesson.vimeoId} title={lesson.title} />

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

      <Suspense fallback={null}>
        <LessonFooterNav
          nextHref={next ? `/skills/${cat.id}/${next.vimeoId}` : undefined}
          nextTitle={next?.title}
        />
      </Suspense>
    </div>
  );
}
