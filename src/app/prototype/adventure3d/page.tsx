import type { Metadata } from "next";
import { AdventureView } from "@/components/adventure/adventure-view";
import { phases, stops } from "./road-data";

export const metadata: Metadata = { title: "The adventure, in 3D" };

// The S.T.O.R.Y. road in real 3D, before it replaces the live map. A
// student part-way through: seven challenges done, on the eighth.

export default function Adventure3DPage() {
  return <AdventureView stops={stops} phases={phases} fallbackAvatar="/prototype/tariq-avatar.jpg" />;
}
