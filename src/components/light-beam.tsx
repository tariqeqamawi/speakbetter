"use client";

// A visible shaft of light: the cone, the smoke hanging in it, and the
// dust falling through.
//
// One component because the beam appears in two places - the trophy
// mount and the trophy room - and a spotlight that is subtly different
// in each is worse than no spotlight. Everything about the light lives
// here; nothing about it is coloured, ever. The lamp is warm white and
// the object under it is what changes.

export function LightBeam({
  /** How far down the frame the cone reaches. */
  height,
  className = "",
}: {
  height: number | string;
  className?: string;
}) {
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 ${className}`} style={{ height }}>
      {/* The cone itself. */}
      <span className="trophy-spot absolute inset-0" />

      {/* And the air it is travelling through, all of it clipped to the
          cone so nothing drifts out into the dark. The dust layers are
          taller than the frame so a tile can travel its full height
          without an edge appearing. */}
      <span className="trophy-beam absolute inset-0 overflow-hidden">
        <span className="trophy-smoke absolute -inset-x-[10%] -inset-y-[15%]" />
        <span className="trophy-smoke-2 absolute -inset-x-[14%] -inset-y-[18%]" />
        <span className="trophy-smoke-3 absolute -inset-x-[18%] -inset-y-[22%]" />
        <span className="trophy-dust-far absolute -inset-y-[20%] inset-x-0" />
        <span className="trophy-dust-near absolute -inset-y-[20%] inset-x-0" />
      </span>
    </span>
  );
}
