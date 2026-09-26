import type { Metadata } from "next";
import { AdventureScreen } from "@/components/adventure/adventure-screen";
import { ROAD_SKY } from "@/components/adventure/world-phases";
import { phases, stops } from "../adventure3d/road-data";

export const metadata: Metadata = { title: "Road film", robots: { index: false, follow: false } };

// The road playing itself once - down to the open challenge, Start
// challenge, the dive, and into it. What scripts/film-tour.mjs road3d
// records for the landing page and the tour.
export default function RoadFilmPage() {
  return <AdventureScreen stops={stops} phases={phases} skyImage={ROAD_SKY} fallbackAvatar="/prototype/tariq-avatar.jpg" demo demoOnce />;
}
