// One entry per data.md comparison group, in the same order as that file.
// Each round supplies everything wireRound() in ../scripts/birds.ts reads off
// the option buttons: the correct species' name/feature/notes, plus plausible
// decoy names. Photos are pulled in by filename from ../assets/birds/ (see
// ATTRIBUTION.md there for licensing/credit); every photo is the round's one
// mystery image, reused captioned on the detail screen, so it has to clearly
// show the feature named below, not just be any photo of the species.
//
// This module is deliberately free of Vite-specific APIs (no
// `import.meta.glob`) so it can be imported by plain Node as well as by
// Astro/Vite — scripts/verify-markers.ts does exactly that to check the
// `marker` coordinates below against the actual photos. The Vite-only glue
// that turns `photoSlug` into a built asset URL lives in ./round-photos.ts,
// imported only from page code.

export type Position = "top" | "bottom" | "left" | "right";

// Where the correct option's `feature` is actually visible in the photo, as a
// percentage of the image's own width/height — not the display container's,
// so this only lines up if the photo is shown at its natural aspect ratio
// (see .detail-photo-wrap in global.css) rather than cropped with object-fit.
export interface MarkerPosition {
  x: number;
  y: number;
}

export interface RoundOption {
  position: Position;
  name: string;
  correct?: true;
  feature?: string;
  notes?: string;
  marker?: MarkerPosition;
}

export interface Round {
  id: string;
  photoSlug: string;
  options: [RoundOption, RoundOption, RoundOption, RoundOption];
}

const roundDefs: Round[] = [
  {
    id: "dove",
    photoSlug: "dove-spotted",
    options: [
      { position: "top", name: "Eurasian Collared Dove" },
      { position: "bottom", name: "Red Turtle Dove" },
      {
        position: "left",
        name: "Spotted Dove",
        correct: true,
        feature: "the white edge of its tail breaks into separate patches, not one continuous band",
        notes: "greyer overall than the Oriental Turtle Dove, with a higher-pitched call; common in parks, gardens, and farmland.",
        marker: { x: 30, y: 80 },
      },
      { position: "right", name: "Oriental Turtle Dove" },
    ],
  },
  {
    id: "tit-japanese",
    photoSlug: "tit-japanese",
    options: [
      {
        position: "top",
        name: "Japanese Tit",
        correct: true,
        feature: "a plain white belly with just one wing bar",
        notes: "recently split from the Great Tit group; common in East Asian towns, gardens, and woodland edge.",
        marker: { x: 54, y: 54 },
      },
      { position: "bottom", name: "Green-backed Tit" },
      { position: "left", name: "Yellow-bellied Tit" },
      { position: "right", name: "Black-throated Tit" },
    ],
  },
  {
    id: "redstart-daurian",
    photoSlug: "redstart-daurian",
    options: [
      { position: "top", name: "Black Redstart" },
      { position: "bottom", name: "Hodgson's Redstart" },
      { position: "left", name: "Plumbeous Water Redstart" },
      {
        position: "right",
        name: "Daurian Redstart",
        correct: true,
        feature: "a large, obvious white wing patch and a sharp colour break between its head and back",
        notes: "a common winter visitor to East Asian gardens and parks, often perching in the open and flicking its tail.",
        marker: { x: 22, y: 50 },
      },
    ],
  },
  {
    id: "redstart-plumbeous",
    photoSlug: "redstart-plumbeous",
    options: [
      { position: "top", name: "Daurian Redstart" },
      {
        position: "bottom",
        name: "Plumbeous Water Redstart",
        correct: true,
        feature: "a slate-blue body with a red tail and no white wing patch at all",
        notes: "found along fast, rocky mountain streams, where it perches on wet boulders bobbing its tail.",
        marker: { x: 72, y: 78 },
      },
      { position: "left", name: "White-capped Redstart" },
      { position: "right", name: "Blue Whistling Thrush" },
    ],
  },
  {
    id: "heron-night",
    photoSlug: "heron-night",
    options: [
      {
        position: "top",
        name: "Black-crowned Night Heron",
        correct: true,
        feature: "spotted wings and a red iris, where the Chinese Pond Heron shows plain white-edged wings and a yellowish-brown iris",
        notes: "an immature bird; roosts in trees by day and forages at dusk, unlike the day-active pond heron.",
        marker: { x: 62, y: 16 },
      },
      { position: "bottom", name: "Chinese Pond Heron" },
      { position: "left", name: "Little Egret" },
      { position: "right", name: "Grey Heron" },
    ],
  },
  {
    id: "egret-little",
    photoSlug: "egret-little",
    options: [
      {
        position: "top",
        name: "Little Egret",
        correct: true,
        feature: "yellow feet at the end of black legs, with yellow-green skin in front of the eye",
        notes: "the smallest of the four white egrets; shuffles its feet in shallow water to stir up prey.",
        marker: { x: 50, y: 77 },
      },
      { position: "bottom", name: "Great Egret" },
      { position: "left", name: "Intermediate Egret" },
      { position: "right", name: "Cattle Egret" },
    ],
  },
  {
    id: "bunting-rustic",
    photoSlug: "bunting-rustic",
    options: [
      { position: "top", name: "Yellow-throated Bunting" },
      { position: "bottom", name: "Meadow Bunting" },
      { position: "left", name: "Little Bunting" },
      {
        position: "right",
        name: "Rustic Bunting",
        correct: true,
        feature: "brown, not black, streaks on the breast and flanks",
        notes: "a winter visitor to farmland and scrub, usually foraging on the ground in small flocks.",
        marker: { x: 31, y: 44 },
      },
    ],
  },
  {
    id: "thrush-naumanns",
    photoSlug: "thrush-naumanns",
    options: [
      { position: "top", name: "Eyebrowed Thrush" },
      {
        position: "bottom",
        name: "Naumann's Thrush",
        correct: true,
        feature: "a dark throat, where the very similar Dusky Thrush shows a white one",
        notes: "forages on open ground and farmland in winter, often flocking together with Dusky Thrushes.",
        marker: { x: 62, y: 36 },
      },
      { position: "left", name: "Dusky Thrush" },
      { position: "right", name: "Grey-backed Thrush" },
    ],
  },
  {
    id: "pipit-olive-backed",
    photoSlug: "pipit-olive-backed",
    options: [
      {
        position: "top",
        name: "Olive-backed Pipit",
        correct: true,
        feature: "strong, dark streaking on the breast and flanks, where the Water Pipit shows little or none",
        notes: "common along woodland edges and in parks; walks rather than hops, bobbing its tail.",
        marker: { x: 52, y: 55 },
      },
      { position: "bottom", name: "Water Pipit" },
      { position: "left", name: "Richard's Pipit" },
      { position: "right", name: "Buff-bellied Pipit" },
    ],
  },
  {
    id: "tit-rufous-vented",
    photoSlug: "tit-rufous-vented",
    options: [
      {
        position: "top",
        name: "Rufous-vented Tit",
        correct: true,
        feature: "very bold white cheeks against a black head — Coal Tit's pattern is more compact, Grey-crested Tit's cheeks are dirty white",
        notes: "found in coniferous forest at higher elevations, often moving through mixed foraging flocks.",
        marker: { x: 42, y: 36 },
      },
      { position: "bottom", name: "Coal Tit" },
      { position: "left", name: "Grey-crested Tit" },
      { position: "right", name: "Sooty Tit" },
    ],
  },
  {
    id: "owlet-collared",
    photoSlug: "owlet-collared",
    options: [
      { position: "top", name: "Asian Barred Owlet" },
      { position: "bottom", name: "Northern Boobook" },
      { position: "left", name: "Eurasian Pygmy Owl" },
      {
        position: "right",
        name: "Collared Owlet",
        correct: true,
        feature: "a head covered in small spots, rather than fine horizontal bars",
        notes: "a small, day-active owl, often mobbed by songbirds when found roosting in the open.",
        marker: { x: 39, y: 12 },
      },
    ],
  },
  {
    id: "kingfisher-common",
    photoSlug: "kingfisher-common",
    options: [
      { position: "top", name: "Pied Kingfisher" },
      {
        position: "bottom",
        name: "Female Common Kingfisher",
        correct: true,
        feature: "an orange-red lower bill — the male's bill is all black",
        notes: "perches over still or slow water, diving headfirst for small fish; both sexes are the same size and colour otherwise.",
        marker: { x: 56, y: 34 },
      },
      { position: "left", name: "Male Common Kingfisher" },
      { position: "right", name: "White-throated Kingfisher" },
    ],
  },
];

export const rounds: Round[] = roundDefs;
