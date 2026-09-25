import type { Metadata } from "next";
import { phases, stops } from "../adventure3d/road-data";
import { SkyCompare } from "./sky-compare";

export const metadata: Metadata = { title: "Skies for the road" };

export default function SkiesPage() {
  return <SkyCompare stops={stops} phases={phases} />;
}
