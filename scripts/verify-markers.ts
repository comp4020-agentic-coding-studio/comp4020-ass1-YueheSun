#!/usr/bin/env node
// Regenerates a preview of every round's detail-photo marker: the stored
// x/y percentage (rounds.ts) composited as a ring directly onto the actual
// source photo, at the same coordinates the site renders in CSS. rounds.ts
// alone can't tell you whether a marker lands on the feature it's supposed
// to point at, or whether the photo is even of the claimed species — both
// are claims about pixel content, not something `pnpm check` can assert
// (see src/data/rounds.test.ts for what it *can* assert: marker coordinates
// in range, photo exists, attribution's species text matches the round).
// This script exists so that judgment call is a repeatable one-command step
// instead of a one-off manual check, per CLAUDE.md's "Verifying detail-photo
// markers" section.
//
// Run after adding or changing a round's photo or marker:
//   pnpm verify:markers
// then look at the files it prints — for each one, confirm (1) the ring
// sits on the feature named next to it, and (2) the photo actually shows the
// species named next to it, not just something that matches at a glance.
import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { rounds } from "../src/data/rounds.ts";

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

const withMarkers = rounds
  .map((round) => ({ round, marker: round.options.find((o) => o.correct)?.marker }))
  .filter((entry): entry is { round: typeof entry.round; marker: NonNullable<typeof entry.marker> } =>
    Boolean(entry.marker),
  );

const skipped = rounds.length - withMarkers.length;
if (skipped > 0) {
  console.log(`Skipping ${skipped} round(s) with no marker on their correct option.`);
}

for (const { round, marker } of withMarkers) {
  const photoPath = `${assetsDir}${round.photoSlug}.jpg`;
  const image = sharp(photoPath);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`Couldn't read dimensions for ${photoPath}`);

  const cx = (width * marker.x) / 100;
  const cy = (height * marker.y) / 100;
  const r = Math.min(width, height) * 0.035;
  const ring = Buffer.from(
    `<svg width="${width}" height="${height}">` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fc3" stroke-width="8"/>` +
      `</svg>`,
  );

  // Composite at full size first, then resize the result — sharp checks the
  // overlay against the *target* size if resize is chained in the same
  // pipeline as composite, which rejects a full-size ring on a shrunk photo.
  const composited = await image.composite([{ input: ring, top: 0, left: 0 }]).toBuffer();
  const outPath = `${outDir}${round.id}.jpg`;
  await sharp(composited)
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(outPath);

  const species = attributedSpecies.get(round.photoSlug) ?? "(no ATTRIBUTION.md row!)";
  console.log(outPath);
  console.log(`  species: ${round.options.find((o) => o.correct)?.name}  (attribution: ${species})`);
  console.log(`  feature: "${round.options.find((o) => o.correct)?.feature}"`);
}

console.log(
  `\nWrote ${withMarkers.length} preview(s) to ${outDir}\n` +
    "Open each one and check TWO things: the ring sits on the feature named\n" +
    "above it, and the photo actually shows the species named above it.",
);
console.log(readdirSync(outDir).length, "file(s) in that folder.");
