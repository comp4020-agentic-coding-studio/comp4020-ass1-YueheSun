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
3. Any pick — right or wrong — jumps straight to a full detail screen (not an
   inline reveal): an outcome line ("Nice!", or "So close! It's the
   `<species>`." naming the correct answer), then the **one** feature that
   actually distinguishes it, then the mystery photo again (now captioned),
   then one short line of habitat/behaviour context underneath. The jump
   between screens is a swipe-style page transition that mirrors the
   direction of the swipe/keypress that triggered it (see "Resolved" below).
4. A "Next" action — tapping (or Enter/Space) anywhere on the detail screen,
   no separate button — advances to the next round. After the last round: a
   plain "that's all of them — play again?" state that resets to round 1. No
   score page, no stats.

That's the whole app. One page, one state machine, one dataset.

## Minimum content this needs to exist at all

- **12 rounds — one per comparison group in `data.md`.** Originally scoped
  as "4–5 rounds" (see "Explicitly cut" below); superseded once asked to turn
  the whole of `data.md` into the game rather than a sample of it. Each round
  needs exactly:
  - one photo (the mystery bird) — this is the only place a photo is
    required; the three decoy option buttons are text-only, no image. It's
    reused as the detail-screen image too, so it must be a representative
    shot that clearly shows the round's one distinguishing feature, not just
    any photo of the species.
  - the correct species' name
  - its one distinguishing feature (a phrase, not a paragraph)
  - one short habitat/behaviour line
  - three decoy species names (plausible confusables, no other data needed)
- Species: drawn from the Chinese-bird feature notes already recorded in
  `data.md`. Photos sourced from Wikimedia Commons via Wikipedia's page-summary
  API (1280px renditions, all CC-licensed), credited in
  `src/assets/birds/ATTRIBUTION.md`.
- No build-time API calls, no live fetch — everything baked into
  `src/data/rounds.ts` (name/photo slug/feature/notes/decoys per round), same
  attribute shape as the fixture already driving `spec/interaction.test.ts`;
  `index.astro` maps over it at build time to emit one `.round` section per
  entry.

## Explicitly cut (add back only if the above ships with time to spare)

- Any second page, route, or "browse all species" view
- A score tally, timer, difficulty levels, or multiple game modes
- Photos for the decoy options — never shown, never needed
- ~~More than ~5 rounds~~ — superseded: all 12 of `data.md`'s comparison
  groups are now rounds, since the whole dataset was the point once asked to
  build from it rather than a sample of it.
- Background music beyond a single looping ambient track with a mute toggle
  — decorative, unrelated to round outcome, first thing to drop if time runs
  short
- Any settings/preferences screen

## Where this lands in the existing scaffold

- `src/pages/index.astro` — the one page; maps over `rounds` from
  `src/data/rounds.ts` to emit one `.round` section per entry (12 currently),
  plus a single `[data-testid="complete"]` end screen.
- `src/scripts/birds.ts` — `initBirdGame()` wires each `.round` exactly like
  the single-round `spec/interaction.test.ts` fixture (unchanged contract:
  `data-correct`/`data-feature`/`data-notes` on one option, per-round
  guess↔detail toggle), then chains them: each round's "Next" advances to the
  next round, or to the complete screen after the last one, which resets back
  to round 1 on tap/Enter/Space. Every round wires its own document-level
  keydown/pointer listeners, so each one checks `round.hidden` first — without
  that guard, every not-yet-reached round would react to the same key press
  or swipe as the one currently on screen.
- Round data: `src/data/rounds.ts` — one entry per round (photo slug, correct
  name/feature/notes, three decoy names), matching the fixture's attributes.
  Photos are pulled in via `import.meta.glob` over `src/assets/birds/*.jpg`.

## Resolved

- **"Next" is any tap on the detail screen itself** — no separate button. The
  detail screen carries button semantics (role/tabindex, plus a document-level
  Enter/Space handler) so this also covers keyboard activation, not just
  pointer/touch.
- **A pick always jumps to a full detail screen**, whether right or wrong —
  not an inline "Nice!"/reveal-panel toggle in place. Right and wrong now
  render the same screen shape (outcome line, feature, photo, notes); only the
  outcome line's wording differs.
- **"Corresponding image" on the detail screen is the same mystery photo**,
  re-shown with a caption that now names the species — not a second photo
  asset per round. Keeps PLAN's "one photo per round" minimum-content
  requirement unchanged, but raises the bar on *which* photo qualifies: it
  must clearly show the one distinguishing feature named in that round, not
  just be any photo of the species. Added below under "Minimum content."
- **The page-transition direction mirrors the swipe/keypress that triggered
  it** — pick "left" (swipe left or ArrowLeft) and the detail screen arrives
  from the right, continuing that motion, not a fixed slide direction.
  Tapping "Next" continues in the same direction rather than reversing it, so
  a full guess→detail→next cycle reads as one motion. Both the direction
  chosen and the resulting `enter-from-*` class are asserted in
  `spec/interaction.test.ts`.
- **Notes (habitat/behaviour) are kept** on the detail screen, appended after
  the photo, even though they weren't explicitly re-requested when this screen
  was redesigned — nothing said to cut them, and they were the original
  science-communication content goal.
- **Keyboard/swipe listeners are attached to `document` (via `round.ownerDocument`),
  not to the `round` element.** A round-scoped `keydown` listener only ever
  fires if focus is already inside `round` when the key is pressed; nothing
  focuses anything there by default, so arrow keys silently did nothing until
  the visitor had already clicked a button once. Swipes were separately broken
  on real touchscreens because `touch-action` defaulted to `auto`, so the
  browser consumed the gesture as a page pan (firing `pointercancel`, which
  wasn't handled, instead of `pointerup`) — fixed with `touch-action: none` on
  `.board`. Both bugs passed the jsdom spec tests because jsdom dispatches
  synthetic events directly with no focus or gesture semantics attached, which
  is exactly why they went unnoticed until tested on a real page/device.
- **Groups in `data.md` with fewer than 4 named species get invented-but-real
  decoy names.** Most groups name only 2–3 confusable species; the fourth (and
  sometimes third) option button in those rounds is filled with another real,
  plausible confusable from the same genus/region that `data.md` doesn't
  mention (e.g. "Eurasian Collared Dove" alongside the Spotted/Oriental Turtle
  Dove pair) — never an invented species, just one `data.md` didn't cover.
- **The Common Kingfisher round is a sex-ID case, not a species-ID one** —
  `data.md`'s group 12 distinguishes male from female by bill colour, not one
  species from another. Kept it as a round anyway (dropping it would silently
  cut a real chunk of the source content) by making the four options "Female
  Common Kingfisher" / "Male Common Kingfisher" plus two genuinely different
  decoy species (Pied Kingfisher, White-throated Kingfisher). The mechanic
  doesn't require the four options to be four different species, only four
  plausible labels with one correct answer, so this fits without changing
  `birds.ts` or the spec contract.

## Open before building

- The specific ambient loop (self-recorded clip vs. a few Web-Audio-API notes)
