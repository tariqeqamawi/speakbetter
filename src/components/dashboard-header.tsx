"use client";

import { useRef, useState } from "react";
import { useStore, type Level } from "@/lib/store";
import { standing } from "@/lib/progress";
import { LevelIcon, levelMeta } from "@/components/level-icon";
import { ChevronDownIcon, ProfileIcon } from "@/components/icons";
import { ProTip } from "@/components/pro-tip";

const levelOrder: Level[] = ["beginner", "intermediate", "advanced"];

// The heads-up display: who they are, what rank they've reached, and —
// held above all of it — the reason they gave for starting. Everything
// else on this page counts what they did; this says why.

const MAX_DIM = 256;

export function DashboardHeader() {
  const { state, setProfile, setIntention, setLevel } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingWhy, setEditingWhy] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.displayName);
  const [whyDraft, setWhyDraft] = useState(state.intention);

  const rank = standing(state);
  const level = state.level ?? "beginner";

  // Downscale before storing: a phone photo would blow the storage
  // budget, and this only ever renders at avatar size anyway.
  const onPick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setProfile({ avatar: canvas.toDataURL("image/jpeg", 0.82) });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-navy-600 bg-navy-800 p-5 sm:p-6">
      <div className="spectrum-rule absolute inset-x-0 top-0 h-1" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-navy-500 bg-navy-900 transition-colors hover:border-ink-faint"
            aria-label="Change your picture"
          >
            {state.avatar ? (
              // A data URL from the student's own device — next/image would
              // only add an optimizer hop for something already sized.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.avatar}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <ProfileIcon className="size-8 text-ink-faint" />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-navy-950/80 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">
              Change
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          <div className="flex flex-col gap-1">
            {editingName ? (
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => {
                  setProfile({ displayName: nameDraft.trim() });
                  setEditingName(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                maxLength={40}
                autoFocus
                placeholder="Your name"
                className="rounded-lg border border-navy-600 bg-navy-900 px-2 py-1 text-xl font-semibold text-ink focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(state.displayName);
                  setEditingName(true);
                }}
                className="text-left text-2xl font-semibold tracking-tight text-ink transition-colors hover:text-ink-muted"
              >
                {state.displayName || "Add your name"}
              </button>
            )}
            {/* Standing, worn plainly — and changed from here. The level
                is the student's own call (§09), so the insignia beside
                their name is the control, not a read-out of one kept
                somewhere else. */}
            <span className="relative flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLevelOpen((v) => !v)}
                aria-expanded={levelOpen}
                aria-haspopup="listbox"
                className={`flex items-center gap-1.5 rounded-full border border-navy-500 bg-navy-900 py-1 pl-1 pr-3 text-xs font-semibold transition-colors hover:border-ink-faint ${levelMeta[level].accentClass}`}
              >
                <LevelIcon level={level} className="h-6 w-auto" />
                {levelMeta[level].label}
                <ChevronDownIcon className="size-3.5 text-ink-faint" />
              </button>
              <span className="text-xs text-ink-faint">{rank.rank.name}</span>

              {levelOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-navy-500 bg-navy-900 shadow-2xl shadow-navy-950/80"
                >
                  {levelOrder.map((option) => {
                    const meta = levelMeta[option];
                    const active = option === state.level;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setLevel(option);
                          setLevelOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                          active ? "bg-navy-700" : "hover:bg-navy-800"
                        }`}
                      >
                        <LevelIcon level={option} className="h-8 w-auto shrink-0" />
                        <span className="flex flex-col">
                          <span
                            className={`text-xs font-semibold ${meta.accentClass}`}
                          >
                            {meta.label}
                            {active && (
                              <span className="ml-2 font-normal text-ink-faint">
                                current
                              </span>
                            )}
                          </span>
                          <span className="text-[0.7rem] leading-snug text-ink-muted">
                            {meta.detail}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </span>
          </div>
        </div>

        {/* rank progress */}
        <div className="flex flex-1 flex-col gap-1.5 sm:items-end">
          <div className="flex w-full items-baseline justify-between gap-3 sm:justify-end">
            <span className="text-xs uppercase tracking-wider text-ink-faint">
              {rank.rank.name}
            </span>
            <span className="text-sm font-bold tabular-nums text-ink">
              {rank.xp.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-navy-900 sm:max-w-xs">
            <div
              className="spectrum-rule h-full rounded-full transition-[width] duration-700"
              style={{ width: `${rank.progress * 100}%` }}
            />
          </div>
          <span className="text-[0.7rem] text-ink-faint">
            {rank.next
              ? `${rank.toNext.toLocaleString()} XP to ${rank.next.name}`
              : "Top rank reached — nothing above this one."}
          </span>
        </div>
      </div>

      {/* The reason they're here, and one idea to act on today. */}
      <div className="mt-5 grid gap-4 border-t border-navy-700 pt-4 lg:grid-cols-2">
        <div>
        {editingWhy ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={whyDraft}
              onChange={(e) => setWhyDraft(e.target.value)}
              rows={3}
              maxLength={280}
              autoFocus
              className="w-full rounded-xl border border-navy-600 bg-navy-900 p-3 text-sm leading-relaxed text-ink focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIntention(whyDraft);
                  setEditingWhy(false);
                }}
                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-navy-900"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingWhy(false)}
                className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs text-ink-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setWhyDraft(state.intention);
              setEditingWhy(true);
            }}
            className="group flex w-full flex-col gap-1 text-left"
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
              Why you started
            </span>
            {state.intention ? (
              <span className="text-base italic leading-relaxed text-ink-muted transition-colors group-hover:text-ink">
                &ldquo;{state.intention}&rdquo;
              </span>
            ) : (
              <span className="text-sm text-ink-faint transition-colors group-hover:text-ink-muted">
                You haven&apos;t written your reason yet — tap to add it.
              </span>
            )}
          </button>
        )}
        </div>
        <ProTip />
      </div>
    </section>
  );
}
