// ONE COACH AT A TIME. Coach speaks from several places - the tour, a
// trophy's reveal, the road, his own page, a "hear this" button - and
// none of them knows about the others, so a trophy won during the tour
// had him talking over himself. Every one of them now asks for the floor
// before it speaks and gives it back when it is done; whoever asks while
// he is already speaking waits their turn, and goes a breath after.

type Turn = { id: symbol; start: () => void };

let holder: symbol | null = null;
const queue: Turn[] = [];
let guard: ReturnType<typeof setTimeout> | undefined;

/** The longest anyone may hold the floor, in case a voice never reports
 *  that it has finished (a clip that fails to load, a tab put away). */
const MAX_TURN_MS = 60_000;
/** The breath between one voice and the next. */
const GAP_MS = 350;

/** Ask to speak. `start` runs once it is your turn - straight away if
 *  nobody is speaking. Returns `done`: call it when you finish speaking
 *  (or are stopped), or to give up a place still waiting in the queue.
 *  Calling it more than once is harmless. */
export function requestFloor(start: () => void): () => void {
  const id = Symbol("turn");
  const begin = () => {
    clearTimeout(guard);
    guard = setTimeout(done, MAX_TURN_MS);
    start();
  };
  function done() {
    const waiting = queue.findIndex((t) => t.id === id);
    if (waiting >= 0) {
      queue.splice(waiting, 1);
      return;
    }
    if (holder !== id) return;
    clearTimeout(guard);
    const next = queue.shift();
    holder = next ? next.id : null;
    if (next) setTimeout(next.start, GAP_MS);
  }
  if (holder === null) {
    holder = id;
    begin();
  } else {
    queue.push({ id, start: begin });
  }
  return done;
}

/** Whether Coach is speaking anywhere right now. */
export function floorTaken(): boolean {
  return holder !== null;
}
