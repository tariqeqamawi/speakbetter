import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Speak Better",
    short_name: "Speak Better",
    description:
      "A speaking course built on practice, not playback. Short lessons, real on-camera challenges, AI coaching in full color.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1220",
    theme_color: "#0a1220",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
