import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopBar, BottomTabs } from "@/components/nav";
import { StoreProvider } from "@/lib/store";
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
};

export const viewport: Viewport = {
  themeColor: "#0a1220",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <StoreProvider>
          <TopBar />
          {/* bottom padding clears the mobile tab bar */}
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-8 sm:pb-12">
            {children}
          </main>
          <BottomTabs />
        </StoreProvider>
      </body>
    </html>
  );
}
