import hashes from "@/data/video-hashes.json";

// Course videos are unlisted on Vimeo, which means the player rejects a
// bare video id with a 403. Unlisted videos only embed when their
// privacy hash rides along as ?h=<hash>.

const hashById = hashes as Record<string, string>;

export function vimeoEmbedUrl(vimeoId: string): string {
  const hash = hashById[vimeoId];
  return hash
    ? `https://player.vimeo.com/video/${vimeoId}?h=${hash}`
    : `https://player.vimeo.com/video/${vimeoId}`;
}

export function vimeoWatchUrl(vimeoId: string): string {
  const hash = hashById[vimeoId];
  return hash ? `https://vimeo.com/${vimeoId}/${hash}` : `https://vimeo.com/${vimeoId}`;
}
