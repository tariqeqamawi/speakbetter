// A film playing very faintly behind a fold - moments of people talking
// to a phone, a ring light, a podcast mic - texture, not content. Dim,
// soft and feathered into the page at every edge, so the words over it
// stay the thing to read. One placement per screen size - behind "Is it
// for you?" on a laptop, behind the opening lion on a phone - and
// anyone who asked for less motion gets the still.
//
// It is an animated image, not a video. Two <video> versions failed on a
// real Windows laptop: drawn as a video layer it showed for a moment and
// vanished; played off screen and painted onto a canvas, Chrome's power
// saving paused it on its first frame. An animated WebP has no autoplay
// rules, no power-saving pause and no special graphics layer - it simply
// animates, everywhere. The softness is baked into the frames.

const MASK = "radial-gradient(50% 50% at 50% 50%, #000 55%, transparent 100%)";

export function FoldBackdrop({
  src,
  still,
  on = "laptop",
}: {
  src: string;
  still: string;
  /** Which screens it plays on - the box is display:none on the others,
   *  so they never fetch it. */
  on?: "laptop" | "phone";
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${
        on === "laptop"
          ? "hidden opacity-[0.28] lg:block"
          : "opacity-[0.22] lg:hidden"
      }`}
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      {/* Lazy, inside a box that is display:none where it doesn't
          belong - so that screen never fetches it. */}
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={still} />
        {/* A plain <img>: the image optimizer would flatten the animation. */}
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      </picture>
    </div>
  );
}
