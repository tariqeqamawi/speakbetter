import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopBar, BottomTabs } from "@/components/nav";
import { StoreProvider } from "@/lib/store";
import { AmbientBackground } from "@/components/ambient-background";
import { CelebrationHost } from "@/components/celebrations";
import { CoachPopIn } from "@/components/coach-popin";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Speak Better",
    template: "%s · Speak Better",
  },
  description:
    "A speaking course built on practice, not playback. Short lessons, real on-camera challenges, and AI coaching across the full spectrum of speaking skills.",
  appleWebApp: {
    capable: true,
    title: "Speak Better",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Speak Better",
    description:
      "A speaking course built on practice, not playback. Short lessons, real on-camera challenges, and AI coaching across the full spectrum of speaking skills.",
    images: ["/logo-full.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speak Better",
    description:
      "Short lessons, real on-camera challenges, and AI coaching in full color.",
    images: ["/logo-full.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#060a15",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AmbientBackground />
        <StoreProvider>
          <TopBar />
          {/* bottom padding clears the mobile tab bar */}
          {/* Phones and tablets keep the narrow, readable column; a laptop
              has room to spare, so the container opens up rather than
              leaving half the screen as gutter. */}
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:pb-12 xl:max-w-[96rem] xl:px-8">
            {children}
          </main>
          <BottomTabs />
          <CelebrationHost />
          <CoachPopIn />
          <ServiceWorkerRegister />
        </StoreProvider>
      </body>
    </html>
  );
}
