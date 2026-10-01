"use client";

import { Component, type ReactNode } from "react";

// If the 3D road falls over - a phone running short of graphics memory
// near the end, where the city is thickest - it shouldn't take the page
// with it and drop the student back on Orientation. This catches the
// failure where the road is and offers to start it again, from where
// they were (the traveller's position lives outside the scene, in
// Travel, so a rebuilt scene picks up at the same spot).

export class RoadGuard extends Component<{ children: ReactNode; onRestart: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("The road stalled:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-navy-950 px-6 text-center">
        <p className="text-base font-semibold text-ink">The road stalled for a moment.</p>
        <p className="max-w-xs text-sm text-ink-muted text-pretty">
          Your phone ran short of graphics memory. Your place is kept - tap to carry on from where you were.
        </p>
        <button
          type="button"
          onClick={() => {
            this.setState({ failed: false });
            this.props.onRestart();
          }}
          className="mt-1 rounded-full border border-body-language/70 bg-navy-800 px-6 py-2.5 text-sm font-semibold text-ink"
        >
          Carry on
        </button>
      </div>
    );
  }
}
