"use client";

import { useEffect, useRef, useState } from "react";

// A long paragraph, folded to its first few lines with "Read more" under
// it - so the landing page reads as headings and short lines, and the
// full text is a tap away for anyone who wants it. Only offers the
// button when the text is actually cut off: a paragraph that fits at
// this width just shows.

export function ReadMore({
  children,
  lines = 3,
  className = "",
  buttonClassName = "",
  label = "Read more",
}: {
  children: React.ReactNode;
  lines?: 2 | 3 | 4 | 5;
  className?: string;
  buttonClassName?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setCut(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clamp = { 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4", 5: "line-clamp-5" }[lines];
  return (
    <div className="flex flex-col items-[inherit] gap-1">
      <div ref={ref} className={`${open ? "" : clamp} ${className}`}>
        {children}
      </div>
      {(cut || open) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`w-fit text-sm font-semibold text-ink-faint underline decoration-ink-faint/50 underline-offset-2 transition-colors hover:text-ink ${buttonClassName}`}
        >
          {open ? "Show less" : label}
        </button>
      )}
    </div>
  );
}
