import type { Metadata } from "next";
import { DataRoom } from "@/components/admin/data-room";

export const metadata: Metadata = {
  title: "Data room",
  robots: { index: false, follow: false },
};

export default function DataRoomPage() {
  return <DataRoom />;
}
