// The Vite-only half of round photo handling, split out of ./rounds.ts so
// that plain data module stays importable from Node scripts (see the comment
// at the top of rounds.ts). Only page/component code should import this.

const photoUrls = import.meta.glob<string>("../assets/birds/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
});

export function photoUrl(slug: string): string {
  const match = Object.entries(photoUrls).find(([path]) => path.endsWith(`/${slug}.jpg`));
  if (!match) throw new Error(`No photo found for slug "${slug}"`);
  return match[1];
}
