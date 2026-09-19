import type { Metadata } from "next";
import CardsPage from "@/app/(app)/skills/cards/page";
import { DemoFrame } from "@/components/demo-frame";

export const metadata: Metadata = {
  title: "Cards preview",
  robots: { index: false, follow: false },
};

export default async function DemoCardsPage(props: { searchParams: Promise<{ bare?: string }> }) {
  const { bare } = await props.searchParams;
  return (
    <DemoFrame bare={bare === "1"}>
      <CardsPage />
    </DemoFrame>
  );
}
