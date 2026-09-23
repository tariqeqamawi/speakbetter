"use client";

// A face for a name. The student's own photo where they've set one;
// otherwise their initial on a color of the spectrum, settled by the
// name so the same person is the same color everywhere. A row of
// identical gray circles tells you nothing about who is in the room.

const COLORS = ["storytelling", "figurative", "acting", "structure", "mindset", "body-language", "advanced"] as const;

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function Avatar({
  name,
  src,
  className = "size-9",
  ring = true,
}: {
  name: string;
  src?: string;
  className?: string;
  ring?: boolean;
}) {
  const color = `var(--color-${avatarColor(name)})`;
  return (
    <span
      title={name}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}
      style={{
        background: src ? "var(--color-navy-700)" : `color-mix(in oklab, ${color} 22%, var(--color-navy-900))`,
        boxShadow: ring ? `inset 0 0 0 1.5px color-mix(in oklab, ${color} 65%, transparent)` : undefined,
        color,
      }}
    >
      {src ? (
        // A data URL from the student's own device, or an avatar the
        // account carries - next/image would only add an optimiser hop.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="text-[0.7em] font-bold uppercase leading-none">{name.trim().charAt(0) || "?"}</span>
      )}
    </span>
  );
}
