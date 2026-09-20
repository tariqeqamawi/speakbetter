import type { Metadata } from "next";
import { ReviewPage } from "@/components/review-page";

// A review, opened again: /review/<attempt id>. Every review Coach has
// given is kept in the student's record, and this is the way back to
// one - the same page it landed on, the voice playable again - from the
// challenge's attempt cards, the coach page's history, and the
// dashboard's recent attempts. Closing the app no longer loses it.

export const metadata: Metadata = { title: "Your review" };

export default async function Page(props: PageProps<"/review/[id]">) {
  const { id } = await props.params;
  return <ReviewPage id={id} />;
}
