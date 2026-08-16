# Process notes (working log, not graded)

Raw candidate moments, logged right after the commit that produced them —
see the "Keep a running candidate log" rule in `CLAUDE.md`. This file is not
cited from `PROCESS.md` and isn't itself part of the evidence a marker reads;
it's where candidates accumulate so the final three or four can be picked
under less time pressure. Trim or delete before shipping.

## Candidates

### Interaction pivoted from field-guide reveal to feature-discrimination + swipe

**What happened:** The carried-forward prototype (from crit2) revealed a
bird's name/feature/distribution on hover-or-tap — a field-guide pattern:
symmetric treatment of many species, no argument. Discussed the brief's
example sites (Deep Sea, Trolley Problems, Mechanical Watch) and noticed the
common thread: one mechanic that *is* the explanation, not decoration on top
of one. Reframed the topic from "browse these birds" to "why you keep
misidentifying these look-alikes": a mystery photo, four species options
placed top/bottom/left/right, chosen by tap/arrow-key/swipe; a correct pick
confirms, a wrong pick reveals the one distinguishing feature (plus brief
habitat/behaviour notes) rather than a full profile.

**Instead of the obvious thing:** the obvious move was to keep the
hover/tap-reveal contract and just add more bird cards. Instead, rewrote the
spec test itself — `spec/interaction.test.ts` — to assert the new contract
(four-way choice, three input paths, feature-first reveal on a miss), and
renamed the stub from `initBirdCards` to `initBirdGame` to match. That's the
harness-level version of the pivot: the check that defines "done" changed,
not just the planned code.

**How I knew it was right:** ran `pnpm vitest run spec/interaction.test.ts`
against the still-empty stub — four of five cases went red for the right
reason (missing behaviour, not a broken fixture/typecheck), one passed
(no-op-before-any-choice), confirming the new contract is well-formed and
buildable before writing any implementation.

**Citation:** [`ed8421d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/ed8421deab4d3af9c62d04c64a49f3f4d5048ecc)
— contains the `spec/interaction.test.ts` rewrite and the `birds.ts` stub
rename together, and only that (not an earlier commit where the code still
showed the old click/hover version).

**Caution:** the earlier "hover alone fails on mobile" lesson is real but
predates this deliverable — it's already encoded in the crit2-era spec this
repo carried forward, so it's context for this pivot, not a separate
A1-original moment on its own.

---

**What happened:** two real-browser-only bugs the jsdom spec tests were
blind to: (1) `keydown` was bound on `round`, but keydown only bubbles from
whatever element has *focus* — nothing inside `round` is focused by default,
so a key press before the visitor clicked anything reached nothing; (2)
swipes were hijacked by the browser as a page pan (`touch-action: auto`
fires `pointercancel`, not `pointerup`, once it recognises a scroll). Both
tests passed anyway because jsdom's `dispatchEvent` targets the element
directly, sidestepping focus/gesture semantics entirely.

**What I did instead of the obvious thing:** rather than just patching the
code and leaving the old tests green, I changed *what the two keyboard/swipe
tests dispatch on* — `document` instead of `round` — reproducing the actual
"no prior focus" condition. Their assertions (`detailScreen.hidden` false,
`outcome.textContent` contains "Nice!") are unchanged; that's the point —
same claim, now checked under the condition that actually broke it, rather
than a different claim. Confirmed by re-diffing the two commits directly
(`git show 6704c50:spec/interaction.test.ts` vs. `f28b965:...`): only
`round.dispatchEvent` → `window.document.dispatchEvent` changed on those two
tests, nothing else. `f28b965` separately adds two brand-new tests with new
assertions (`enter-from-bottom` class) for the direction-mirroring feature —
a distinct correction (transition direction should follow the swipe/keypress,
not be fixed), bundled into the same commit but not part of this moment.

**How I knew it was right:** re-read the old listener scope against the new
dispatch target — a `round`-scoped listener would miss a `document`-dispatched
event, so the old code would fail these tests where it used to pass them.
`pnpm check` went 21/21 → 23/23 (2 retargeted + 2 new).

**Citation:** [`6704c50`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/6704c50)
(the bug fix + first spec rewrite, inline reveal → full detail-screen
redesign) and [`f28b965`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/f28b965)
(direction-mirroring + the document-dispatch regression-guard rewrite).

**Caution:** `6704c50`'s spec rewrite alone (inline reveal → detail screen)
is a genuine harness-level moment on its own — the contract a check verifies
changed shape, not just the code under an unchanged contract. The
document-dispatch strengthening in `f28b965` is a second, separable
harness-level moment: it's not "retry until green," it's noticing the first
green was measuring the wrong thing and fixing the check itself.

---

### Generalized from one hardcoded round to a 12-round chain sourced from data.md

**What happened:** asked to turn `data.md`'s 12 bird-comparison groups into
real quiz content — real photos (sourced/licensed from Wikimedia Commons,
credited in `src/assets/birds/ATTRIBUTION.md`) and real feature/decoy text
(`src/data/rounds.ts`), replacing the single placeholder round (SVG
silhouette, made-up sparrow options) that `index.astro` had shipped with.

**Not just a content swap:** `birds.ts`'s `initBirdGame` only ever supported
one static round — "Next" just re-showed the same round's guess screen
forever. Generalized it to actually chain N rounds (advance to the next one,
or a "play again" screen after the last) without touching the per-round
contract `spec/interaction.test.ts` already asserts — each round still wires
identically to that fixture. This surfaced a real bug the single-round case
couldn't: every round attaches its own document-level keydown/pointer
listener, so with 12 of them live at once, a key press or swipe would have
fired all 12 rounds' handlers simultaneously (each checking only its own
local guess/detail state, oblivious to whether its round was the one on
screen). Fixed by guarding every document-level handler on `round.hidden`.
This is the same *category* of mistake as the earlier focus-scoping bug
(logic implicitly assumed a precondition — "only one round's listeners are
live" — that stopped holding once the architecture changed) but a distinct
instance, not the same bug recurring.

**Content judgment calls, not just data entry:** most `data.md` groups name
only 2–3 species, not 4, so decoy slots needed filling with real-but-unlisted
confusables (documented in `PLAN.md`'s "Resolved" section so the reasoning
isn't just buried in a data file). And group 12 (Common Kingfisher) is a
male/female bill-colour distinction, not a species-ID case — kept it as a
round anyway rather than silently dropping a chunk of the source content, by
making the four options two sex-labelled variants plus two real decoy
species; the mechanic doesn't actually require four different species, just
four plausible labels with one correct one.

**How I knew it was right:** `pnpm check` (typecheck, build, oxlint,
stylelint, `vitest run`) green at 23/23 after the generalization, and
confirmed the built `dist/index.html` actually contains 12 `.round` sections
and 48 option buttons (one set of 4 per round) rather than trusting the
source alone.

**Citation:** [`f4c5b58`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/f4c5b58)

**Caution:** I could not visually verify in a real browser that each chosen
photo clearly shows its round's named feature (Playwright/Chromium is
non-functional in this environment — missing system shared libraries,
`apt-get install` blocked without interactive sudo). Photo choices lean on
Wikipedia's lead image plus, for the kingfisher, a Commons search specifically
for a female-labelled specimen — reasoned best-effort, not confirmed by eye.

---

### Added photo-annotation markers, which forced eye-verification of every photo and caught 3 that didn't show their claimed feature

**What happened:** to connect the quiz interaction more directly to the
science-communication content, added a marker (a pulsing ring, positioned via
build-time-computed percentage coordinates in `rounds.ts`) on the detail-screen
photo pointing at exactly where each round's named feature is visible — so the
interaction shows the mark, not just states it in text.

**Not just a feature add — it closed the exact gap flagged above:** placing a
marker requires knowing the feature's precise pixel location, which is a much
stronger test than "does this photo look roughly right" — it's impossible to
mark a location that doesn't visually exist. With no working headless browser
still available (`agent-browser` also confirmed not installed this session),
built a proxy: composited an SVG ring onto each source JPEG at its stored
coordinates with `sharp` (pulled from its nested pnpm path, since it isn't
hoisted) and viewed the output directly. This is what actually surfaced the
three real content bugs the previous entry's Caution predicted might exist:
`dove-spotted.jpg` didn't show the tail pattern the round claims (side-profile,
tail folded), `heron-night.jpg` was an *adult* with plain wings when the round's
text explicitly says "immature... spotted wings," and `thrush-naumanns.jpg`
showed a pale throat when `data.md` explicitly claims Naumann's Thrush has a
dark one (confirmed by grepping `data.md` directly, not just re-reading
`rounds.ts`). All three were re-sourced from Wikimedia Commons and swapped in;
`ATTRIBUTION.md` updated to match.

**How I knew it was right:** for all 12 rounds, generated a marker-on-photo
composite and read it back before trusting the stored coordinates — including
one case (`kingfisher-common.jpg`) that looked like a fourth mismatch (bill
reads as solid black in the full photo) until a tight crop on just the bill
confirmed the lower mandible's base genuinely is orange-red, so no photo
change was needed there — the ambiguity was resolution/lighting, not a wrong
photo. `pnpm check` stayed green (23/23) throughout, including fixing two
stylelint violations on the new marker CSS (`#ffcc33`→`#fc3`,
`rgba(0,0,0,.35)`→`rgb(0 0 0 / 35%)`).

**Citation:** [`752ab25`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/752ab25)

**Caution:** this closes the previous entry's Caution for 3 of 12 photos by
direct discovery, but the other 9 were only confirmed to show their feature at
the specific marker point checked — not audited for every other claim in their
`feature`/`notes` text. Treat "photo shows the named feature" as verified, not
"photo has zero other issues."

---

### Turned the previous entry's one-off marker check into a wired-up, repeatable one

**What happened:** the previous entry's marker verification was a one-time
manual pass — I looked, found 3 bad photos, fixed them, and the process left
no trace that could catch the next mistake. Asked directly whether that could
become "a check wired up" instead of just a process note. Talked through what
part of "does the marker land on the right feature" is actually mechanical
(coordinate in `[0,100]`, photo file exists — checkable by `vitest`/CI) versus
semantic (does the marked pixel show the claimed feature — only checkable by
looking at the image, and there's no vision model in the CI/test environment
to do that for you). Rejected wiring a live vision-API call into the check
itself: it would need a committed secret, adds cost and non-determinism to
`pnpm check`, and a pass wouldn't actually prove content correctness, just
create false confidence that it had been checked.

**What got built instead of the obvious thing:** the obvious move would have
stopped at "remember to look next time." Instead: (1) `src/data/rounds.test.ts`
— a real `vitest` test, so `pnpm check` now fails hard on an out-of-range
marker or a missing photo file; (2) `scripts/verify-markers.ts` (`pnpm
verify:markers`) — composites every round's marker onto its actual source
photo and writes a contact sheet to `.previews/markers/` (gitignored, so
review output is never mistaken for reviewed-and-committed evidence); (3) a
new CLAUDE.md section, "Verifying detail-photo markers," making running and
eyeballing that script a required step before committing any round's
photo/marker change — the check that defines "done" for a marker change now
includes a human-eye pass, not just green CI. Required splitting `rounds.ts`
(plain data, importable from Node) out of a new `round-photos.ts` (the
Vite-only `import.meta.glob` half), since the verify script runs in plain Node
outside Vite.

**How I knew it was right:** `pnpm verify:markers` produced 12 correctly
composited previews (confirmed by reading two of them back — `owlet-collared`
ring on the head, `kingfisher-common` ring on the bill base — both matching
their `feature` text); `pnpm check` green after the `rounds.ts`/`round-photos.ts`
split (47/47 tests, clean typecheck/build); `pnpm-lock.yaml` diff reviewed and
limited to `sharp` becoming a direct rather than optional dependency.

**Citation:** [`d4ca5d4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/d4ca5d4)

**Caution:** the contact sheet still requires a human to actually look and
compare against the feature text each time — nothing stops someone from
running `pnpm verify:markers` and skipping the "open every file" step. The
CLAUDE.md rule makes that failure mode visible in review (a photo/marker
commit with no corresponding "I looked" trail), not impossible.
