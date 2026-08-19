import type { MetadataRoute } from "next";

// The installable identity. PNG icons carry the install prompt - iOS
// ignores SVG icons entirely - with the SVGs kept as a sharp "any"
// fallback for browsers that prefer them. Colors match the darkened
// navy ramp in globals.css.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Speak Better",
    short_name: "Speak Better",
    description:
      "A speaking course built on practice, not playback. Short lessons, real on-camera challenges, AI coaching in full color.",
    start_url: "/",
    id: "/",
    scope: "/",
    lang: "en-US",
    dir: "ltr",
    display: "standalone",
    // Standalone is the intent; minimal-ui is the graceful step down on
    // a browser that won't give up its chrome, and browser is the floor.
    display_override: ["standalone", "minimal-ui"],
    // Tapping a lesson link with the app already open should land in the
    // window that's already there, not open a second copy of the course.
    launch_handler: { client_mode: "navigate-existing" },
    background_color: "#060a15",
    theme_color: "#060a15",
    orientation: "portrait",
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    // Chrome offers the richer install dialog - a preview of the app
    // instead of a bare icon and a URL - only when both form factors are
    // present. Captured from the real build by
    // scripts/build-pwa-screenshots.mjs, so the preview is the product.
    screenshots: [
      {
        src: "/screenshots/today-narrow.png",
        sizes: "824x1600",
        type: "image/png",
        form_factor: "narrow",
        label: "Today: the next lesson, the streak, the day's quests",
      },
      {
        src: "/screenshots/skills-narrow.png",
        sizes: "824x1600",
        type: "image/png",
        form_factor: "narrow",
        label: "Seven colors of speaking, each a section of short lessons",
      },
      {
        src: "/screenshots/cards-narrow.png",
        sizes: "824x1600",
        type: "image/png",
        form_factor: "narrow",
        label: "The deck: one card per lesson, sorted by color",
      },
      {
        src: "/screenshots/today-wide.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Today: the next lesson, the streak, the day's quests",
      },
      {
        src: "/screenshots/skills-wide.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Seven colors of speaking, each a section of short lessons",
      },
      {
        src: "/screenshots/cards-wide.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "The deck: one card per lesson, sorted by color",
      },
    ],
    // What a long-press on the home-screen icon offers. Four, because
    // that's what Android shows, and none of them is Today - the icon
    // itself already goes there. Icons come from
    // scripts/build-pwa-icons.mjs, the nav glyphs on the app's navy.
    shortcuts: [
      {
        name: "Challenges",
        short_name: "Challenges",
        description: "The next thing to film",
        url: "/challenges",
        icons: [
          {
            src: "/shortcuts/challenges.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Skills",
        short_name: "Skills",
        description: "The lesson library, by section",
        url: "/skills",
        icons: [
          { src: "/shortcuts/skills.png", sizes: "96x96", type: "image/png" },
        ],
      },
      {
        name: "Cards",
        short_name: "Cards",
        description: "Pull one card of every color",
        url: "/skills/cards",
        icons: [
          { src: "/shortcuts/cards.png", sizes: "96x96", type: "image/png" },
        ],
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Streak, XP and badges",
        url: "/profile",
        icons: [
          {
            src: "/shortcuts/dashboard.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
