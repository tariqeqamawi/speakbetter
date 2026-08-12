// Skeleton for the gated pages. A page that fades in from a shape reads
// as faster than one that pops in fully formed, even at identical speed.

export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6 py-6" aria-hidden>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 rounded bg-navy-700" />
        <div className="h-8 w-56 rounded bg-navy-700" />
        <div className="h-4 w-full max-w-lg rounded bg-navy-800" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-4 overflow-hidden rounded-xl border border-navy-600 bg-navy-800"
          >
            <div className="aspect-video w-32 shrink-0 bg-navy-700 sm:w-44" />
            <div className="flex flex-1 flex-col justify-center gap-2 py-3 pr-4">
              <div className="h-4 w-2/3 rounded bg-navy-700" />
              <div className="h-3 w-full rounded bg-navy-700/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
