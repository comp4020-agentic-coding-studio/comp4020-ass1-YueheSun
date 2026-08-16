import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { rounds } from "./rounds";

// A marker with a coordinate outside the photo, or pointing at a photo that
// doesn't exist, is a bug this can catch instantly — whether the ring lands
// on the *right part* of the photo is a separate, human/eye question that
// only `pnpm verify:markers` can answer (see scripts/verify-markers.ts and
// the "Verifying detail-photo markers" section of CLAUDE.md).
describe("round marker coordinates", () => {
  for (const round of rounds) {
    const correct = round.options.find((option) => option.correct);
    const marker = correct?.marker;
    if (!marker) continue;

    it(`${round.id}: marker sits within the photo's bounds`, () => {
      expect(marker.x).toBeGreaterThanOrEqual(0);
      expect(marker.x).toBeLessThanOrEqual(100);
      expect(marker.y).toBeGreaterThanOrEqual(0);
      expect(marker.y).toBeLessThanOrEqual(100);
    });

    it(`${round.id}: has a photo for its marker to sit on`, () => {
      const photoPath = fileURLToPath(
        new URL(`../assets/birds/${round.photoSlug}.jpg`, import.meta.url),
      );
      expect(existsSync(photoPath)).toBe(true);
    });
  }
});
