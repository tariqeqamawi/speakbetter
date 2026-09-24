import { Soundwave } from "@/components/soundwave";

// The one button that belongs to Coach: the big drifting-colour pill
// with his voice running through it.
//
// It used to be drawn three ways - the big waveform pill on the
// landing page's feature, a quiet navy pill under the smaller lion, a
// thin outlined "Hear it from Coach" elsewhere - so the same act,
// hearing Coach, looked like three different controls depending on
// which screen it was on. Anything that makes him speak is this pill
// now, everywhere, and nothing else is.

export function CoachPill({
  children,
  onClick,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`coach-pill coach-voice relative flex min-h-14 items-center justify-center overflow-hidden rounded-full px-10 font-bold hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      {/* The wave, running the width of the pill behind the words. */}
      {/* In a layer of its own. Soundwave's root is `relative`, and
          handed `absolute` as well it came out relative - a flex item
          that shrank to nothing, so the wave this button was built
          around was never actually drawn. */}
      <span aria-hidden className="pointer-events-none absolute inset-0">
        <Soundwave variant="coach" className="size-full" />
      </span>
      {/* A soft dark bar behind the words, so they stay legible where
          the brightest part of the wave passes under them. */}
      <span className="relative flex items-center gap-2 whitespace-nowrap rounded-full bg-navy-950/55 px-3 py-0.5 text-base text-white">
        {children}
      </span>
    </button>
  );
}
