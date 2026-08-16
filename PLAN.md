# PLAN.md — working file, not the spec

The smallest version of this explainer, cut down to one idea and one
mechanic. Anything not in "the one mechanic" below is out until this ships.

## The one idea

You keep misidentifying these look-alike birds because you're looking at the
wrong feature. Show me a photo of one, I'll show you what to actually look
for.

## The one mechanic

A round:

1. One mystery photo, four species-name buttons positioned top / bottom /
   left / right around it.
2. Visitor picks one — by tapping/clicking the button, by an arrow key, or by
   swiping. All three are the same action through different input devices,
   not three features.
3. Correct → "Nice!" appears in place. Wrong → a reveal panel replaces it:
   the correct species' name, the **one** feature that actually distinguishes
   it from the others in the round, and one short line of habitat/behaviour
   context underneath.
4. A "Next" action advances to the next round. After the last round: a plain
   "that's all of them — play again?" state that resets to round 1. No score
   page, no stats.

That's the whole app. One page, one state machine, one dataset.

## Minimum content this needs to exist at all

- **4–5 rounds.** Each round needs exactly:
  - one photo (the mystery bird) — this is the only place a photo is
    required; the three decoy option buttons are text-only, no image.
  - the correct species' name
  - its one distinguishing feature (a phrase, not a paragraph)
  - one short habitat/behaviour line
  - three decoy species names (plausible confusables, no other data needed)
- Species: drawn from the Chinese-bird feature notes already recorded.
  Photos are the one missing ingredient — need one per round, sourced before
  build starts (iNaturalist, properly licensed, or self-supplied).
- No build-time API calls, no live fetch — everything baked into one small
  local data file (name/photo path/feature/notes/decoys per round), same
  shape as the fixture already driving `spec/interaction.test.ts`.

## Explicitly cut (add back only if the above ships with time to spare)

- Any second page, route, or "browse all species" view
- A score tally, timer, difficulty levels, or multiple game modes
- Photos for the decoy options — never shown, never needed
- More than ~5 rounds — this is a mechanic to feel, not a catalogue
- Background music beyond a single looping ambient track with a mute toggle
  — decorative, unrelated to round outcome, first thing to drop if time runs
  short
- Any settings/preferences screen

## Where this lands in the existing scaffold

- `src/pages/index.astro` — the one page; round markup replaces the current
  starter intro.
- `src/scripts/birds.ts` — `initBirdGame()` already stubbed against
  `spec/interaction.test.ts`'s contract (fixture: one `[data-testid="round"]`,
  four `[data-testid="option"]`s, one carrying `data-correct`, a `feedback`
  and a `reveal` element). Implementation just needs to generalize the fixture
  shape to a sequence of rounds plus the "Next" advance.
- Round data: a small local array (or JSON), one entry per round, matching
  the fixture's attributes.

## Resolved

- **"Next" is any tap on the reveal panel itself** — no separate button. The
  reveal panel is a real `<button>` (or has button semantics) so this also
  covers keyboard activation for free, not just pointer/touch.

## Open before building

- Exact species/photo list for the 4–5 rounds (need photos — see above)
- The specific ambient loop (self-recorded clip vs. a few Web-Audio-API notes)
