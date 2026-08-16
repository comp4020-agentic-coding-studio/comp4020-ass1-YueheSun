#!/usr/bin/env node
// Regenerates a preview of every feature card's annotations: the stored
// x/y percentages (rounds.ts) composited as numbered rings directly onto the
// actual source photo, at the same coordinates the site renders in CSS.
// rounds.ts alone can't tell you whether a ring lands on the feature it's
// supposed to point at, or whether the photo is even of the claimed species
// — both are claims about pixel content, not something `pnpm check` can
// assert (see src/data/rounds.test.ts for what it *can* assert: annotation
// coordinates in range, photo exists, attribution's species text matches
// the card). This script exists so that judgment call is a repeatable
// one-command step instead of a one-off manual check, per CLAUDE.md's
// "Verifying detail-photo markers" section.
//
// Run after adding or changing a card's photo or annotation coordinates:
//   pnpm verify:markers
// then look at the files it prints — for each one, confirm (1) every
// numbered ring sits on the feature its label claims, and (2) the photo
// actually shows the species named next to it, not just something that
// matches at a glance. Leader-line and dropdown-switcher rendering are NOT
// covered here — those need a real rendered-page pass, see CLAUDE.md.
import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { rounds } from "../src/data/rounds.ts";
import type { ConfusableCard, SpeciesCard } from "../src/data/rounds.ts";

const assetsDir = fileURLToPath(new URL("../src/assets/birds/", import.meta.url));
const outDir = fileURLToPath(new URL("../.previews/markers/", import.meta.url));

const attributionText = readFileSync(
  fileURLToPath(new URL("../src/assets/birds/ATTRIBUTION.md", import.meta.url)),
  "utf-8",
);
const attributedSpecies = new Map<string, string>();
for (const line of attributionText.split("\n")) {
  const match = /^\|\s*`([^`]+)\.jpg`\s*\|\s*([^|]+)\|/.exec(line);
  if (match) attributedSpecies.set(match[1], match[2].trim());
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

interface CardEntry {
  outName: string;
  card: SpeciesCard | ConfusableCard;
}

// The shared Daurian Redstart object (see rounds.ts) renders once per round
// it appears in — same photo, same annotations, expected, not a duplicate
// bug, since each round's own outName ("redstart-daurian-primary" vs.
// "redstart-plumbeous-confusable-redstart-daurian") is already unique.
const cards: CardEntry[] = rounds.flatMap((round) => [
  { outName: `${round.id}-primary`, card: round.primary },
  ...round.confusables.map((confusable) => ({
    outName: `${round.id}-confusable-${confusable.photoSlug}`,
    card: confusable,
  })),
]);

for (const { outName, card } of cards) {
  if (card.annotations.length === 0) continue;

  const photoPath = `${assetsDir}${card.photoSlug}.jpg`;
  const image = sharp(photoPath);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`Couldn't read dimensions for ${photoPath}`);

  const r = Math.min(width, height) * 0.03;
  const rings = card.annotations
    .map((annotation, i) => {
      const cx = (width * annotation.x) / 100;
      const cy = (height * annotation.y) / 100;
      return (
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fc3" stroke-width="6"/>` +
        `<text x="${cx}" y="${cy}" fill="#fc3" font-size="${r * 1.4}" font-weight="bold" ` +
        `text-anchor="middle" dominant-baseline="central" stroke="#000" stroke-width="2" ` +
        `paint-order="stroke">${i + 1}</text>`
      );
    })
    .join("");
  const overlay = Buffer.from(`<svg width="${width}" height="${height}">${rings}</svg>`);

  // Composite at full size first, then resize the result — sharp checks the
  // overlay against the *target* size if resize is chained in the same
  // pipeline as composite, which rejects full-size rings on a shrunk photo.
  const composited = await image.composite([{ input: overlay, top: 0, left: 0 }]).toBuffer();
  const outPath = `${outDir}${outName}.jpg`;
  await sharp(composited)
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(outPath);

  const species = attributedSpecies.get(card.photoSlug) ?? "(no ATTRIBUTION.md row!)";
  console.log(outPath);
  console.log(`  species: ${card.name} — ${card.latinName}  (attribution: ${species})`);
  card.annotations.forEach((annotation, i) => {
    console.log(`  ${i + 1}. ${annotation.label}`);
  });
}

console.log(
  `\nWrote ${cards.length} preview(s) to ${outDir}\n` +
    "Open each one and check TWO things: every numbered ring sits on the\n" +
    "feature named next to its number, and the photo actually shows the\n" +
    "species named above it.",
);
console.log(readdirSync(outDir).length, "file(s) in that folder.");
