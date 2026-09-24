import Image from "next/image";

/** The lion's head at small size - the mark, not a frame of the roar
 *  animation, which reads as a fault when it is only a few dozen
 *  pixels across. */
export function CoachMark({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`grid place-items-center overflow-hidden rounded-full ${className}`}>
      <Image src="/logo-mark.png" alt="" width={120} height={96} className="size-full object-contain" />
    </span>
  );
}
