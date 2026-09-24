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
      className={`coach-pill relative flex min-h-12 items-center justify-center overflow-hidden rounded-full px-7 font-bold hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      {/* The wave, running the width of the pill behind the words. */}
      <Soundwave variant="coach" className="pointer-events-none absolute inset-0 size-full opacity-45" />
      {/* Its own colour: the pill paints its text in the drifting
          colour, which is also the background. */}
      <span className="relative flex items-center gap-2 whitespace-nowrap text-sm text-navy-950">{children}</span>
    </button>
  );
}
