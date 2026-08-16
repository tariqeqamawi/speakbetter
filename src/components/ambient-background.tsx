// Slow-drifting spotlights behind the whole app (master plan §14).
// Pure CSS - no client JS, no scroll listeners; the motion lives in
// globals.css so it costs nothing to render on the server.

export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <div className="ambient-light ambient-light-1" />
      <div className="ambient-light ambient-light-2" />
      <div className="ambient-light ambient-light-3" />
      <div className="ambient-light ambient-light-4" />
      <div className="ambient-light ambient-light-5" />
    </div>
  );
}
