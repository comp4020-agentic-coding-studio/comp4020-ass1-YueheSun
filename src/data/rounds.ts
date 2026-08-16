// One entry per data.md comparison group, in the same order as that file.
// Each round supplies the guess-screen options (position/name/correct) plus
// two kinds of feature card: `primary` (the correct species) and one or more
// `confusables` — species it's genuinely confused with, each carrying every
// distinguishing feature data.md lists for it, not just one. Photos are
// pulled in by filename from ../assets/birds/ (see ATTRIBUTION.md there for
// licensing/credit); every photo has to clearly show the features annotated
// on it, not just be any photo of the species.
//
// This module is deliberately free of Vite-specific APIs (no
// `import.meta.glob`) so it can be imported by plain Node as well as by
// Astro/Vite — scripts/verify-markers.ts does exactly that to check the
// `annotations` coordinates below against the actual photos. The Vite-only
// glue that turns a `photoSlug` into a built asset URL lives in
// ./round-photos.ts, imported only from page code.

export type Position = "top" | "bottom" | "left" | "right";

// Where a listed feature is actually visible in the photo, as a percentage
// of the image's own width/height — not the display container's, so this
// only lines up if the photo is shown at its natural aspect ratio (see
// .annotated-photo in global.css) rather than cropped with object-fit.
export interface Annotation {
  x: number;
  y: number;
  label: string;
}

export interface SpeciesCard {
  name: string;
  latinName: string;
  photoSlug: string;
  notes: string;
  annotations: Annotation[];
}

export interface ConfusableCard extends SpeciesCard {
  // How to tell this species apart from the round's primary — quoted from
  // data.md's own "Quick tip" where one exists, synthesized from its bullets
  // where one doesn't.
  comparisonNote: string;
}

export interface RoundOption {
  position: Position;
  name: string;
  correct?: true;
}

export interface Round {
  id: string;
  options: [RoundOption, RoundOption, RoundOption, RoundOption];
  primary: SpeciesCard;
  confusables: [ConfusableCard, ...ConfusableCard[]];
}

// Rounds 3 and 4 both feature the Daurian Redstart — round 3 as the correct
// answer, round 4 as the confusable for the Plumbeous Water Redstart, same
// species and same photo. Authored once here and referenced from both rounds
// so its annotations/notes can't drift into two disagreeing copies.
const daurianRedstartCard: ConfusableCard = {
  name: "Daurian Redstart",
  latinName: "Phoenicurus auroreus",
  photoSlug: "redstart-daurian",
  notes:
    "A common winter visitor to East Asian gardens and parks, often perching in the open and flicking its tail.",
  annotations: [
    { x: 22, y: 50, label: "large white wing patch" },
    { x: 36, y: 20, label: "sharp head/back colour boundary" },
    { x: 45, y: 28, label: "black face (male)" },
    { x: 50, y: 60, label: "orange-red belly" },
    { x: 18, y: 66, label: "red tail" },
  ],
  comparisonNote:
    "White wing patch → Daurian Redstart. White rump → female Plumbeous Water Redstart. Red tail but no white wing patch → male Plumbeous Water Redstart.",
};

const roundDefs: Round[] = [
  {
    id: "dove",
    options: [
      { position: "top", name: "Eurasian Collared Dove" },
      { position: "bottom", name: "Red Turtle Dove" },
      { position: "left", name: "Spotted Dove", correct: true },
      { position: "right", name: "Oriental Turtle Dove" },
    ],
    primary: {
      name: "Spotted Dove",
      latinName: "Spilopelia chinensis",
      photoSlug: "dove-spotted",
      notes:
        "Overall greyer and higher-voiced than the Oriental Turtle Dove; common in parks, gardens, and farmland.",
      annotations: [
        { x: 60, y: 25, label: "greyer overall plumage" },
        { x: 30, y: 80, label: "white tail edge broken into patches" },
      ],
    },
    confusables: [
      {
        name: "Oriental Turtle Dove",
        latinName: "Streptopelia orientalis",
        photoSlug: "dove-turtle",
        notes: "Heavily patterned and deeper-voiced than the Spotted Dove; found in woodland and farmland edge.",
        annotations: [
          { x: 55, y: 35, label: "heavily patterned plumage" },
          { x: 72, y: 79, label: "continuous white tail edge" },
        ],
        comparisonNote:
          "Continuous white tail edge → Oriental Turtle Dove. Broken white tail edge → Spotted Dove.",
      },
    ],
  },
  {
    id: "tit-japanese",
    options: [
      { position: "top", name: "Japanese Tit", correct: true },
      { position: "bottom", name: "Green-backed Tit" },
      { position: "left", name: "Yellow-bellied Tit" },
      { position: "right", name: "Black-throated Tit" },
    ],
    primary: {
      name: "Japanese Tit",
      latinName: "Parus minor",
      photoSlug: "tit-japanese",
      notes: "Recently split from the Great Tit group; common in East Asian towns, gardens, and woodland edge.",
      annotations: [
        { x: 60, y: 40, label: "white belly" },
        { x: 54, y: 54, label: "one wing bar" },
      ],
    },
    confusables: [
      {
        name: "Green-backed Tit",
        latinName: "Parus monticolus",
        photoSlug: "tit-green-backed",
        notes: "A montane relative of the Japanese Tit, found in broadleaf and mixed forest.",
        annotations: [
          { x: 55, y: 55, label: "yellow-green belly" },
          { x: 65, y: 48, label: "two wing bars" },
        ],
        comparisonNote:
          "One wing bar and a white belly → Japanese Tit. Two wing bars and a yellow-green belly → Green-backed Tit.",
      },
    ],
  },
  {
    id: "redstart-daurian",
    options: [
      { position: "top", name: "Black Redstart" },
      { position: "bottom", name: "Hodgson's Redstart" },
      { position: "left", name: "Plumbeous Water Redstart" },
      { position: "right", name: "Daurian Redstart", correct: true },
    ],
    primary: daurianRedstartCard,
    confusables: [
      {
        name: "Black Redstart",
        latinName: "Phoenicurus ochruros",
        photoSlug: "redstart-black",
        notes:
          "A scarcer, more uniformly-coloured cousin of the Daurian Redstart, favouring rocky ground, cliffs, and urban habitats.",
        annotations: [
          { x: 62, y: 47, label: "white wing patch weak or absent" },
          { x: 45, y: 25, label: "head and back evenly coloured" },
        ],
        comparisonNote:
          "Daurian Redstart shows a bold white wing patch and a sharp colour break between head and back. Black Redstart lacks the wing patch and looks uniformly coloured from head to back.",
      },
    ],
  },
  {
    id: "redstart-plumbeous",
    options: [
      { position: "top", name: "Daurian Redstart" },
      { position: "bottom", name: "Plumbeous Water Redstart", correct: true },
      { position: "left", name: "White-capped Redstart" },
      { position: "right", name: "Blue Whistling Thrush" },
    ],
    primary: {
      name: "Plumbeous Water Redstart",
      latinName: "Phoenicurus fuliginosus",
      photoSlug: "redstart-plumbeous",
      notes: "Found along fast, rocky mountain streams, where it perches on wet boulders bobbing its tail.",
      annotations: [
        { x: 50, y: 45, label: "slate-blue body (male)" },
        { x: 72, y: 78, label: "red tail" },
        { x: 65, y: 58, label: "no white wing patch" },
      ],
    },
    confusables: [daurianRedstartCard],
  },
  {
    id: "heron-night",
    options: [
      { position: "top", name: "Black-crowned Night Heron", correct: true },
      { position: "bottom", name: "Chinese Pond Heron" },
      { position: "left", name: "Little Egret" },
      { position: "right", name: "Grey Heron" },
    ],
    primary: {
      name: "Black-crowned Night Heron",
      latinName: "Nycticorax nycticorax",
      photoSlug: "heron-night",
      notes:
        "An immature bird; roosts in trees by day and forages at dusk, unlike the day-active Chinese Pond Heron. Similar in size to the egrets, and noticeably larger than the Chinese Pond Heron.",
      annotations: [
        { x: 30, y: 45, label: "spotted wings" },
        { x: 62, y: 16, label: "red iris" },
      ],
    },
    confusables: [
      {
        name: "Chinese Pond Heron",
        latinName: "Ardeola bacchus",
        photoSlug: "heron-pond",
        notes:
          "Non-breeding plumage; the smallest of the three, day-active and often seen alone at the water's edge.",
        annotations: [
          { x: 35, y: 45, label: "white wing edges" },
          { x: 62, y: 25, label: "yellowish-brown iris" },
        ],
        comparisonNote:
          "Pond Heron < Night Heron ≈ Egret in size. Night Heron shows spotted wings and a red iris; Pond Heron shows plain white-edged wings and a yellowish-brown iris.",
      },
    ],
  },
  {
    id: "egret-little",
    options: [
      { position: "top", name: "Little Egret", correct: true },
      { position: "bottom", name: "Great Egret" },
      { position: "left", name: "Intermediate Egret" },
      { position: "right", name: "Cattle Egret" },
    ],
    primary: {
      name: "Little Egret",
      latinName: "Egretta garzetta",
      photoSlug: "egret-little",
      notes:
        "The smallest of the four white egrets; shuffles its feet in shallow water to stir up prey. In breeding plumage its bill turns yellowish.",
      annotations: [
        { x: 18, y: 38, label: "black bill" },
        { x: 28, y: 34, label: "yellow-green lores" },
        { x: 62, y: 75, label: "black legs" },
        { x: 50, y: 77, label: "yellow feet" },
      ],
    },
    confusables: [
      {
        name: "Great Egret",
        latinName: "Ardea alba",
        photoSlug: "egret-great",
        notes: "The largest of the white egrets; in breeding plumage its bill darkens.",
        annotations: [
          { x: 46, y: 29, label: "yellow bill" },
          { x: 42, y: 26, label: "greenish-blue lores" },
          { x: 25, y: 78, label: "black legs and feet" },
          { x: 39, y: 28, label: "gape line extends past the eye" },
        ],
        comparisonNote:
          "Yellow feet → Little Egret. Gape line extends past the eye → Great Egret. (Gape line stops before the eye → Intermediate Egret; short, round, chunky body → Cattle Egret.)",
      },
    ],
  },
  {
    id: "bunting-rustic",
    options: [
      { position: "top", name: "Yellow-throated Bunting" },
      { position: "bottom", name: "Meadow Bunting" },
      { position: "left", name: "Little Bunting" },
      { position: "right", name: "Rustic Bunting", correct: true },
    ],
    primary: {
      name: "Rustic Bunting",
      latinName: "Emberiza rustica",
      photoSlug: "bunting-rustic",
      notes: "A winter visitor to farmland and scrub, usually foraging on the ground in small flocks.",
      annotations: [{ x: 31, y: 44, label: "brown streaks on breast and flanks" }],
    },
    confusables: [
      {
        name: "Little Bunting",
        latinName: "Emberiza pusilla",
        photoSlug: "bunting-little",
        notes: "A smaller relative of the Rustic Bunting, favouring similar farmland and scrub in winter.",
        annotations: [{ x: 45, y: 55, label: "black streaks on breast and flanks" }],
        comparisonNote: "Black streaks on breast and flanks → Little Bunting. Brown streaks → Rustic Bunting.",
      },
    ],
  },
  {
    id: "thrush-naumanns",
    options: [
      { position: "top", name: "Eyebrowed Thrush" },
      { position: "bottom", name: "Naumann's Thrush", correct: true },
      { position: "left", name: "Dusky Thrush" },
      { position: "right", name: "Grey-backed Thrush" },
    ],
    primary: {
      name: "Naumann's Thrush",
      latinName: "Turdus naumanni",
      photoSlug: "thrush-naumanns",
      notes: "Forages on open ground and farmland in winter, often flocking together with Dusky Thrushes.",
      annotations: [{ x: 62, y: 36, label: "dark throat" }],
    },
    confusables: [
      {
        name: "Dusky Thrush",
        latinName: "Turdus eunomus",
        photoSlug: "thrush-dusky",
        notes: "Very similar to Naumann's Thrush and often seen in the same mixed winter flocks.",
        annotations: [{ x: 36, y: 33, label: "white throat" }],
        comparisonNote: "Dark throat → Naumann's Thrush. White throat → Dusky Thrush.",
      },
    ],
  },
  {
    id: "pipit-olive-backed",
    options: [
      { position: "top", name: "Olive-backed Pipit", correct: true },
      { position: "bottom", name: "Water Pipit" },
      { position: "left", name: "Richard's Pipit" },
      { position: "right", name: "Buff-bellied Pipit" },
    ],
    primary: {
      name: "Olive-backed Pipit",
      latinName: "Anthus hodgsoni",
      photoSlug: "pipit-olive-backed",
      notes: "Common along woodland edges and in parks; walks rather than hops, bobbing its tail.",
      annotations: [{ x: 52, y: 55, label: "strong dark streaking on breast and flanks" }],
    },
    confusables: [
      {
        name: "Water Pipit",
        latinName: "Anthus spinoletta",
        photoSlug: "pipit-water",
        notes: "Favours wetter, more open habitats than the Olive-backed Pipit, often near water.",
        annotations: [{ x: 49, y: 42, label: "little or no streaking on breast and flanks" }],
        comparisonNote:
          "Strong dark streaking on breast and flanks → Olive-backed Pipit. Little or no streaking → Water Pipit.",
      },
    ],
  },
  {
    id: "tit-rufous-vented",
    options: [
      { position: "top", name: "Rufous-vented Tit", correct: true },
      { position: "bottom", name: "Coal Tit" },
      { position: "left", name: "Grey-crested Tit" },
      { position: "right", name: "Sooty Tit" },
    ],
    primary: {
      name: "Rufous-vented Tit",
      latinName: "Periparus rubidiventris",
      photoSlug: "tit-rufous-vented",
      notes: "Found in coniferous forest at higher elevations, often moving through mixed foraging flocks.",
      annotations: [{ x: 35, y: 32, label: "very bold white cheeks" }],
    },
    // data.md's tit group has no single disambiguating quick tip across all
    // three species — Coal Tit and Grey-crested Tit are both genuine
    // look-alikes, so both get their own switchable card rather than
    // forcing a single pick.
    confusables: [
      {
        name: "Coal Tit",
        latinName: "Periparus ater",
        photoSlug: "tit-coal",
        notes: "A small, active tit found across temperate forest, often the smallest in a mixed flock.",
        annotations: [{ x: 57, y: 25, label: "compact black-and-white head pattern" }],
        comparisonNote:
          "Coal Tit shows a compact black-and-white head pattern, without the Rufous-vented Tit's bold white cheek patch.",
      },
      {
        name: "Grey-crested Tit",
        latinName: "Lophophanes dichrous",
        photoSlug: "tit-grey-crested",
        notes: "Found in coniferous mountain forest; paler overall than its Rufous-vented and Coal Tit relatives.",
        annotations: [
          { x: 54, y: 37, label: "dirty-white cheeks" },
          { x: 60, y: 41, label: "white patch on side of neck" },
          { x: 55, y: 55, label: "paler overall" },
        ],
        comparisonNote:
          "Grey-crested Tit looks paler overall, with dirty-white (not bold white) cheeks and a prominent white neck patch — Rufous-vented Tit's cheek patch is bolder and cleaner white, with no neck patch.",
      },
    ],
  },
  {
    id: "owlet-collared",
    options: [
      { position: "top", name: "Asian Barred Owlet" },
      { position: "bottom", name: "Northern Boobook" },
      { position: "left", name: "Eurasian Pygmy Owl" },
      { position: "right", name: "Collared Owlet", correct: true },
    ],
    primary: {
      name: "Collared Owlet",
      latinName: "Glaucidium brodiei",
      photoSlug: "owlet-collared",
      notes: "A small, day-active owl, often mobbed by songbirds when found roosting in the open.",
      annotations: [{ x: 39, y: 12, label: "head covered in small spots" }],
    },
    confusables: [
      {
        name: "Eurasian Pygmy Owl",
        latinName: "Glaucidium passerinum",
        photoSlug: "owl-pygmy",
        notes: "Europe's smallest owl, found in coniferous forest; also day-active and often perches in the open.",
        annotations: [{ x: 48, y: 15, label: "fine horizontal bars across the head" }],
        comparisonNote:
          "Head covered in small spots → Collared Owlet. Fine horizontal bars across the head → Eurasian Pygmy Owl.",
      },
    ],
  },
  {
    id: "kingfisher-common",
    options: [
      { position: "top", name: "Pied Kingfisher" },
      { position: "bottom", name: "Female Common Kingfisher", correct: true },
      { position: "left", name: "Male Common Kingfisher" },
      { position: "right", name: "White-throated Kingfisher" },
    ],
    primary: {
      name: "Female Common Kingfisher",
      latinName: "Alcedo atthis",
      photoSlug: "kingfisher-common",
      notes:
        "Perches over still or slow water, diving headfirst for small fish; both sexes are the same size and colour otherwise.",
      annotations: [
        { x: 52, y: 30, label: "upper mandible black" },
        { x: 56, y: 34, label: "lower mandible orange-red" },
      ],
    },
    confusables: [
      {
        name: "Male Common Kingfisher",
        latinName: "Alcedo atthis",
        photoSlug: "kingfisher-common-male",
        notes: "Identical in size and plumage to the female, apart from an all-black bill.",
        annotations: [{ x: 60, y: 32, label: "entire bill black" }],
        comparisonNote: "All-black bill → male. Red lower bill → female.",
      },
    ],
  },
];

export const rounds: Round[] = roundDefs;
