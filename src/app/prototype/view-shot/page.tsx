import type { Metadata } from "next";
import { AdventureScreen } from "@/components/adventure/adventure-screen";
import { ROAD_SKY } from "@/components/adventure/world-phases";
import { phases, stops } from "../adventure3d/road-data";

export const metadata: Metadata = { title: "View shot", robots: { index: false, follow: false } };

// The road in one view, on its own, for photographing: ?mode=3d is the
// calm view from above, driving to the next challenge; ?mode=4d is the
// full ride gliding through the city of every colour. The pictures in
// the road's locked-view notes (adventure-view.tsx) are taken here.
export default async function ViewShotPage(props: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await props.searchParams;
  const four = mode === "4d";
  return (
    <AdventureScreen
      stops={stops}
      phases={phases}
      skyImage={ROAD_SKY}
      fallbackAvatar="/prototype/tariq-avatar.jpg"
      heightClass="h-dvh"
      demo
      calm={!four}
      showcase={four ? "victory" : undefined}
    />
  );
}
