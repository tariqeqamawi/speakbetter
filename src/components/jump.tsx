"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { lessons } from "@/data/lessons";
import { challenges, storyPhases } from "@/data/challenges";
import { categoryById } from "@/data/categories";
import { useStore } from "@/lib/store";
import { ChallengesIcon, SearchIcon, SkillsIcon, XIcon } from "@/components/icons";

// Jump: one box that finds any lesson, any challenge, or any section,
// opened with "/" or ctrl/cmd-K from anywhere in the app. Eighty-one
// lessons is more than anyone will browse for a particular one, and a
// student who half-remembers "the one about the pause" shouldn't have
// to guess which color it lives in.

interface Target {
  kind: "lesson" | "challenge" | "place";
  label: string;
  sub: string;
  href: string;
  color?: string;
}

function targets(): Target[] {
  const places: Target[] = [
    { kind: "place", label: "Today", sub: "Your home", href: "/" },
    { kind: "place", label: "Challenges", sub: "The STORY journey", href: "/challenges" },
    { kind: "place", label: "Skills", sub: "Every lesson", href: "/skills" },
    { kind: "place", label: "Cards", sub: "The deck", href: "/skills/cards" },
    { kind: "place", label: "Coach", sub: "Ask him anything", href: "/coach" },
    { kind: "place", label: "You", sub: "Your dashboard", href: "/profile" },
    { kind: "place", label: "Community", sub: "Everyone on the road", href: "/community" },
    { kind: "place", label: "Live sessions", sub: "The six calls, and every recording", href: "/live" },
    { kind: "place", label: "Take the tour", sub: "Shown around the app in a minute", href: "/?tour=1" },
  ];
  const ls: Target[] = lessons.map((l) => {
    const cat = categoryById.get(l.category);
    return {
      kind: "lesson",
      label: l.title,
      sub: cat?.name ?? "Lesson",
      href: `/skills/${l.category}/${l.vimeoId}`,
      color: cat?.textClass,
    };
  });
  const cs: Target[] = challenges.map((c) => {
    const phase = storyPhases.find((p) => p.id === c.phase);
    return {
      kind: "challenge",
      label: c.title,
      sub: `${phase?.id} · ${phase?.name}`,
      href: `/challenges/${c.slug}`,
      color: phase?.textClass,
    };
  });
  return [...places, ...cs, ...ls];
}

/** Every word of the query has to appear somewhere in the row. */
function matches(t: Target, q: string): boolean {
  const hay = `${t.label} ${t.sub}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

export function JumpButton() {
  const { state, ready } = useStore();
  const [open, setOpen] = useState(false);

  // "/" anywhere, or ctrl/cmd-K - unless they're typing into something.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready || !state.unlocked) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-tour="jump"
        aria-label="Jump to a lesson or challenge"
        title="Jump to… (press /)"
        className="flex min-h-11 items-center gap-2 rounded-full border border-navy-600 px-3 text-sm text-ink-faint transition-colors hover:border-ink-faint hover:text-ink"
      >
        <SearchIcon className="size-4" />
        <span className="hidden lg:inline">Jump to…</span>
        <kbd className="hidden rounded border border-navy-600 px-1 text-[0.6rem] font-sans text-ink-faint lg:inline">/</kbd>
      </button>
      {open && <JumpPalette onClose={() => setOpen(false)} />}
    </>
  );
}

function JumpPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const all = useMemo(() => targets(), []);
  const found = useMemo(() => (q ? all.filter((t) => matches(t, q)).slice(0, 12) : all.slice(0, 8)), [all, q]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setHost(document.body);
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const go = (t: Target | undefined) => {
    if (!t) return;
    // Navigate first: closing unmounts this, and a push from a
    // component on its way out doesn't always land.
    router.push(t.href);
    onClose();
  };

  if (!host) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-navy-950/80 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Jump to"
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-navy-500 bg-navy-850 shadow-2xl shadow-navy-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-navy-600 px-4">
          <SearchIcon className="size-4 shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((n) => Math.min(found.length - 1, n + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((n) => Math.max(0, n - 1));
              }
              if (e.key === "Enter") go(found[active]);
            }}
            placeholder="Jump to a lesson, a challenge, a section…"
            className="min-h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full text-ink-faint hover:text-ink">
            <XIcon className="size-4" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-1">
          {found.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-faint">Nothing by that name.</li>}
          {found.map((t, i) => (
            <li key={`${t.kind}-${t.href}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(t)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === active ? "bg-navy-700" : "hover:bg-navy-800"
                }`}
              >
                <span className={`shrink-0 ${t.color ?? "text-ink-faint"}`}>
                  {t.kind === "lesson" ? (
                    <SkillsIcon className="size-4" />
                  ) : t.kind === "challenge" ? (
                    <ChallengesIcon className="size-4" />
                  ) : (
                    <SearchIcon className="size-4" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-ink">{t.label}</span>
                  <span className="truncate text-[0.7rem] text-ink-faint">{t.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-navy-600 px-4 py-2 text-[0.65rem] text-ink-faint">
          ↑↓ to move · enter to open · esc to close
        </p>
      </div>
    </div>,
    host,
  );
}
