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
    display: "standalone",
    background_color: "#060a15",
    theme_color: "#060a15",
    orientation: "portrait",
    categories: ["education", "productivity"],
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
  };
}
