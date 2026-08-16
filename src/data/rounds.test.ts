import { existsSync, readFileSync } from "node:fs";
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

// Catches the mechanical half of "is this the right photo": did the
// attribution record for this file get updated to match the species this
// round actually claims? It can't tell you whether the photo's *pixels*
// really show that species — that's the same human-eye question as the
// marker position, and pnpm verify:markers now prints both side by side so
// one look covers both. See "Verifying detail-photo markers" in CLAUDE.md.
describe("round photo attribution matches the claimed species", () => {
  const attributionPath = fileURLToPath(
    new URL("../assets/birds/ATTRIBUTION.md", import.meta.url),
  );
  const attributionText = readFileSync(attributionPath, "utf-8");

  // Row shape: | `slug.jpg` | Species shown text | ... |
  const rows = new Map<string, string>();
  for (const line of attributionText.split("\n")) {
    const match = /^\|\s*`([^`]+)\.jpg`\s*\|\s*([^|]+)\|/.exec(line);
    if (match) rows.set(match[1], match[2].trim());
  }

  for (const round of rounds) {
    const correct = round.options.find((option) => option.correct);
    if (!correct) continue;

    it(`${round.id}: ATTRIBUTION.md has a row naming ${round.photoSlug}.jpg`, () => {
      expect(rows.has(round.photoSlug)).toBe(true);
    });

    it(`${round.id}: attribution's species text names "${correct.name}"`, () => {
      const speciesText = rows.get(round.photoSlug) ?? "";
      // Strip a sex label so "Female Common Kingfisher" matches an
      // attribution entry phrased as "Common Kingfisher, female".
      const bareName = correct.name.replace(/^(Male|Female)\s+/i, "");
      expect(speciesText.toLowerCase()).toContain(bareName.toLowerCase());
    });
  }
});
