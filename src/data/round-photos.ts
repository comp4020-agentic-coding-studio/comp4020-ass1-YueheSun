// The Vite-only half of round photo handling, split out of ./rounds.ts so
// that plain data module stays importable from Node scripts (see the comment
// at the top of rounds.ts). Only page/component code should import this.
import type { Round } from "./rounds";

const photoUrls = import.meta.glob<string>("../assets/birds/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
});

function photoUrl(slug: string): string {
  const match = Object.entries(photoUrls).find(([path]) => path.endsWith(`/${slug}.jpg`));
  if (!match) throw new Error(`No photo found for round "${slug}"`);
  return match[1];
}

export function roundPhotoUrl(round: Round): string {
  return photoUrl(round.photoSlug);
}
