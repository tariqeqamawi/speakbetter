"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

// The lesson's words, folded away under it. The transcripts file is
// half a megabyte, so it is fetched only when a student actually opens
// the panel - see app/api/transcript.

export function LessonTranscript({ vimeoId }: { vimeoId: string }) {
  const [open, setOpen] = useState(false);
  // Keyed by lesson, so a different lesson starts clean without an
  // effect resetting state during render.
  const [got, setGot] = useState<{ id: string; text: string | null; missing: boolean }>({ id: vimeoId, text: null, missing: false });
  const text = got.id === vimeoId ? got.text : null;
  const missing = got.id === vimeoId ? got.missing : false;

  useEffect(() => {
    if (!open || text !== null || missing) return;
    let alive = true;
    fetch(`/api/transcript?lesson=${vimeoId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("none"))))
      .then((j: { text?: string }) => {
        if (!alive) return;
        setGot({ id: vimeoId, text: j.text ?? null, missing: !j.text });
      })
      .catch(() => alive && setGot({ id: vimeoId, text: null, missing: true }));
    return () => {
      alive = false;
    };
  }, [open, vimeoId, text, missing]);

  if (missing && !open) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-navy-600 bg-navy-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        Transcript
        <ChevronDownIcon className={`size-4 shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="max-w-prose whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-ink-muted">
          {text ?? (missing ? "No transcript for this lesson yet." : "Fetching the words…")}
        </p>
      )}
    </section>
  );
}
