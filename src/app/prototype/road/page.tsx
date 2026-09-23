import type { Metadata } from "next";
import { PhaseRibbon, RoadDrawn, RoadTilted } from "@/components/road-mock";

export const metadata: Metadata = { title: "The road, two ways" };

// A bench, not a page of the app: what the journey would look like if
// it ran bottom to top with real depth, drawn two ways so the choice
// can be made by looking.

export default function RoadPrototypePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">The road, two ways</h1>
        <p className="max-w-2xl text-sm text-ink-muted">
          Today the journey is a list walked downwards with a slight tilt on it. Both of these run{" "}
          <b className="font-semibold text-ink">bottom to top</b> instead: the checkpoint you are standing on is
          nearest and largest, and the road ahead of you shrinks away into the distance. Scrolling would walk you
          forward - the stop you are on swells and slides past, and the next one grows out of the distance to take its
          place.
        </p>
        <PhaseRibbon />
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-ink">A · Drawn perspective</h2>
          <p className="max-w-2xl text-sm text-ink-muted">
            Nothing is rotated. Each stop gets its own size, fade and drift from how far up the road it is, on a curve
            we choose - which matters, because true linear perspective makes the fifth stop too small to read long
            before it is far enough away to feel distant. Text stays perfectly crisp, and every circle is still a
            normal tappable target.
          </p>
        </div>
        <RoadDrawn />
        <p className="text-xs text-ink-faint">
          Costs: the ground and the trail have to be faked into the same recession by hand, and the scale curve has to
          be driven from scroll position to get the walking-forward feel.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-ink">B · A tilted plane</h2>
          <p className="max-w-2xl text-sm text-ink-muted">
            The road is one plane laid back in 3D and anchored at the bottom, so the ground, the contours and the
            trail all recede together for free - the browser does the maths. This is what the app does today, pushed
            much further. The tilt cycles here so you can see where it stops reading as a road and starts reading as a
            folded band.
          </p>
        </div>
        <RoadTilted />
        <p className="text-xs text-ink-faint">
          Costs: everything on the plane is rendered at an angle, so text softens as it goes back and each label has
          to be counter-rotated to stay readable - which is what the current map already does, and why its far end
          looks slightly blurred.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-navy-600 bg-navy-800 p-5">
        <h2 className="text-lg font-bold text-ink">My read</h2>
        <p className="text-sm text-ink-muted">
          <b className="font-semibold text-ink">A</b>, for the reason that is easiest to miss: the road is a list of
          buttons a student has to hit with a thumb, and B tilts every one of them away from the finger. A keeps them
          flat and round and exactly where they look, and still gives the depth - the recession is doing the work, not
          the rotation. B is the cheaper build and the more literal 3D, and it is the right answer if the feeling of
          standing on a landscape matters more than the tapping.
        </p>
      </section>
    </main>
  );
}
