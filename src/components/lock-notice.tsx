"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { lockMessage } from "@/lib/skills-lock";
import { clearLocked, useLocked } from "@/lib/lock-notice";
import { LockIcon, XIcon } from "@/components/icons";

/** The notice for a locked colour: what's locked, what to watch to open
 *  it, and a way straight to those lessons. Raised by showLocked
 *  (lib/lock-notice.ts); closes itself after a while, or on X. */
export function LockNotice() {
  const asked = useLocked();
  const { state, ready } = useStore();
  const prefix = usePathname().startsWith("/demo") ? "/demo" : "";

  useEffect(() => {
    if (!asked) return;
    const t = setTimeout(clearLocked, 9000);
    return () => clearTimeout(t);
  }, [asked]);

  if (!asked || !ready) return null;
  const { title, body, now } = lockMessage(state, asked.colour);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4">
      <div
        key={asked.at}
        role="alert"
        className={`coach-cue no-glass pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-2xl border border-current bg-navy-850 p-4 shadow-[0_18px_44px_-14px_rgb(2_5_11/0.95)] ${now.textClass}`}
      >
        <div className="flex items-start gap-2.5">
          <LockIcon className="mt-0.5 size-4 shrink-0 text-ink-muted" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="text-sm text-ink-muted text-pretty">{body}</p>
          </div>
          <button
            type="button"
            onClick={clearLocked}
            aria-label="Close"
            className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:text-ink"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <Link
          href={`${prefix}/skills/${now.id}?all=1`}
          onClick={clearLocked}
          className={`ml-6.5 inline-flex min-h-10 items-center self-start rounded-full px-4 text-sm font-bold text-navy-950 ${now.bgClass}`}
        >
          Watch {now.name} lessons
        </Link>
      </div>
    </div>
  );
}
