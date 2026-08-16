import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { rounds } from "./rounds";
import type { ConfusableCard, SpeciesCard } from "./rounds";

function allCards(): { roundId: string; card: SpeciesCard | ConfusableCard }[] {
  return rounds.flatMap((round) => [
    { roundId: round.id, card: round.primary },
    ...round.confusables.map((confusable) => ({ roundId: round.id, card: confusable })),
  ]);
}

// An annotation with a coordinate outside the photo, or pointing at a photo
// that doesn't exist, is a bug this can catch instantly — whether each ring
// lands on the *right part* of the photo is a separate, human/eye question
// that only `pnpm verify:markers` can answer (see scripts/verify-markers.ts
// and the "Verifying detail-photo markers" section of CLAUDE.md).
describe("card annotation coordinates", () => {
  for (const { roundId, card } of allCards()) {
    it(`${roundId} — ${card.name}: has at least one annotation`, () => {
      expect(card.annotations.length).toBeGreaterThan(0);
    });

    for (const annotation of card.annotations) {
      it(`${roundId} — ${card.name}: "${annotation.label}" sits within the photo's bounds`, () => {
        expect(annotation.x).toBeGreaterThanOrEqual(0);
        expect(annotation.x).toBeLessThanOrEqual(100);
        expect(annotation.y).toBeGreaterThanOrEqual(0);
        expect(annotation.y).toBeLessThanOrEqual(100);
      });
    }

    it(`${roundId} — ${card.name}: has a photo for its annotations to sit on`, () => {
      const photoPath = fileURLToPath(
        new URL(`../assets/birds/${card.photoSlug}.jpg`, import.meta.url),
      );
      expect(existsSync(photoPath)).toBe(true);
    });
  }
});

// Catches the mechanical half of "is this the right photo": did the
// attribution record for this file get updated to match the species this
// card actually claims? It can't tell you whether the photo's *pixels*
// really show that species — that's the same human-eye question as the
// annotation position, and pnpm verify:markers now prints both side by side
// so one look covers both. See "Verifying detail-photo markers" in
// CLAUDE.md.
describe("card photo attribution matches the claimed species", () => {
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

  for (const { roundId, card } of allCards()) {
    it(`${roundId} — ${card.name}: ATTRIBUTION.md has a row naming ${card.photoSlug}.jpg`, () => {
      expect(rows.has(card.photoSlug)).toBe(true);
    });

    it(`${roundId} — ${card.name}: attribution's species text names it`, () => {
      const speciesText = rows.get(card.photoSlug) ?? "";
      // Strip a sex label so "Female Common Kingfisher" matches an
      // attribution entry phrased as "Common Kingfisher, female".
      const bareName = card.name.replace(/^(Male|Female)\s+/i, "");
      expect(speciesText.toLowerCase()).toContain(bareName.toLowerCase());
    });
  }
});

// A guard against the primary card's name and the correct guess-screen
// option's name silently drifting apart across 12 hand-authored rounds.
describe("round primary card matches its correct option", () => {
  for (const round of rounds) {
    it(`${round.id}: correct option is named after the primary card`, () => {
      const correct = round.options.find((option) => option.correct);
      expect(correct?.name).toBe(round.primary.name);
    });
  }
});
