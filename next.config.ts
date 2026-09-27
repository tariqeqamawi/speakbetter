import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` and `next build` corrupt each other's caches when they
  // share .next (dev is often running here while a production check
  // builds). Point dev at its own directory via the env var; build and
  // start keep the default .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // speakbetter.app/home is the landing page too - the address people
  // guess.
  async redirects() {
    return [{ source: "/home", destination: "/landing", permanent: false }];
  },
};

export default nextConfig;
