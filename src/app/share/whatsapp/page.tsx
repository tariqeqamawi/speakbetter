import type { Metadata } from "next";
import { SHARE_LINE, SHARE_TITLE, SQUARE } from "@/lib/share";

// What WhatsApp's link preview reads. The proxy sends only WhatsApp's
// crawler here (people always get the real page), so its chats show the
// square card, which fits their thumbnail, in place of the wide one.

export const metadata: Metadata = {
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_LINE,
    images: [SQUARE],
    type: "website",
    siteName: "Speak Better",
    url: "https://speakbetter.app",
  },
  robots: { index: false },
};

export default function WhatsAppShare() {
  return <p>{SHARE_LINE}</p>;
}
