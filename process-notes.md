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
manual pass — I looked, found 3 of 12 photos didn't show their claimed
feature, fixed them, and the process left no trace that could catch the next
mistake. That "3 of 12" result is the actual signal here: it means the risk of
a mislabeled marker isn't a one-off, it's structural — it'll recur every time
a round's photo or coordinates change, with nothing forcing a re-check. Asked
directly whether that could become "a check wired up" instead of just a
process note.

**The pushback that shaped the design:** I proposed a two-tier split —
mechanical bounds test in `vitest`/CI, human-reviewed contact sheet for the
semantic part — and explained there's no vision model in the CI/test
environment to judge pixel content. Pushback: since the correction I'd just
made *did* rely on a semantic judgment about image content, could that
judgment be built into the workflow itself — a machine pass first, human
review after? My answer: technically yes, a script could call the Claude API
with the composited image plus the round's `feature` text and ask for a
match/no-match verdict, flagging uncertain ones. I recommended against wiring
that into the repo's checks: it needs a live API key present at runtime with
nowhere safe to keep it committed (this repo's whole secrets sensor exists to
keep keys out of tracked files), it's non-deterministic and costs money on
every CI run, and a confident-but-wrong verdict is worse than no verdict at
all, since a green check here would get trusted the same way `pnpm check` is.
That's a bigger, riskier harness change than the actual problem — 12 photos,
checked once — justifies. No pushback on that; built the two-tier version.

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

---

### Widened the marker check to species identity after a bug report, even though the report turned out to be a false alarm

**What happened:** a report came in that `dove-spotted.jpg` might actually
show a bird of prey, not the Spotted Dove the round claims — the same failure
category as the earlier photo mismatches, but one the existing marker/feature
check couldn't have caught, since it only ever looks at *where* the ring sits,
not *what species* is in the photo. Audited all 12 photos against their
claimed species and Commons sources before touching any code. Verdict: 11
clearly matched; the flagged one didn't actually check out as wrong — a tight
crop showed a straight (non-raptor) bill and the black-and-white speckled neck
patch that's the Spotted Dove's diagnostic "spotted" collar, and the Commons
source page consistently labels it Spotted Dove with no dispute recorded
anywhere. Reported that disagreement back rather than silently swapping the
photo to match the report.

**Widened the check anyway:** a false alarm on this specific photo doesn't
mean the gap it pointed at wasn't real — nothing enforced that a round's
species name and its photo's attribution stayed in agreement, and nothing
prompted a reviewer to check species identity at all, only feature placement.
Extended `src/data/rounds.test.ts` with a mechanical cross-check (each round's
species name must appear, sex-prefix-normalized, in `ATTRIBUTION.md`'s
recorded species text for that photo — catches a swapped photo whose
attribution row didn't get updated) and extended `scripts/verify-markers.ts`
to print the claimed species next to each preview, so the same human-eye pass
that already checks marker placement now also checks species identity in one
look. Updated the CLAUDE.md section to ask for both. This is the same
two-tier pattern as the original marker check (mechanical test + human-eye
contact sheet) applied to a second, previously-unchecked claim, not a new
mechanism.

**How I knew it was right:** `pnpm check` went 47/47 → 71/71 (24 new
attribution-cross-check assertions, one pair per round); `pnpm verify:markers`
re-run and its output confirmed to print species + feature correctly for all
12 rounds, including the sex-prefix normalization working for
`kingfisher-common` ("Female Common Kingfisher" vs. attribution's "Common
Kingfisher, female").

**Citation:** [`aafd0ad`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/aafd0ad)

**Caution:** the mechanical cross-check only catches label *disagreement*
between `rounds.ts` and `ATTRIBUTION.md` — it can't catch a photo that's
mislabeled identically in both places (attribution copied from a wrongly-IDed
Commons file, matching a round name that was written to match). That failure
mode still depends entirely on the human-eye pass, same as feature placement
always has.

---

### Retired tap-anywhere-to-advance on the detail screen after a usability report, and rewrote the spec test to assert the opposite of what it used to

**What happened:** the detail screen's "Next" affordance had been the whole
screen — any tap on the photo, the notes, anywhere — since the crit2-era
interaction pivot (`ed8421d`, logged above). Reported as too easy to trigger
by accident: reading the feature/notes text and misjudging a tap boundary
would skip straight to the next round. Replaced it with a single dedicated
`<button data-testid="detail-next">Next</button>`; removed the
`role="button" tabindex="0"` and click listener from `screen-detail` itself.

**Not just a UI tweak — the check that defines "done" flipped its own
polarity:** `spec/interaction.test.ts` previously had a test literally titled
"returns to the guess screen on a tap anywhere on the detail screen — 'Next'
is the detail screen itself," asserting that a click on `detailScreen`
advances. Renamed/retargeted that test to click `detailNext` instead, and
added a new one asserting the reverse of the old contract: a click on
`detailScreen` (not the button) must leave the detail screen showing. Same
file, same suite, now enforcing the opposite behaviour from before — this is
the "check itself changed shape" bar the harness rules ask for, not a
same-standard retry.

**How I knew it was right:** `pnpm check` green at 72/72 (interaction spec +
`rounds.test.ts` unaffected). Playwright wasn't launchable out of the box in
this environment (missing `libnspr4`/NSS shared libs, no passwordless sudo to
install them) — found already-extracted `.deb` contents under
`/tmp/pwlibs/extracted` from an earlier setup step and pointed
`LD_LIBRARY_PATH` at them instead of giving up on real-browser verification.
Drove the built `pnpm preview` site (mind the configured `base`,
`/comp4020-ass1-YueheSun/`, or requests 404) at both 1920×1080 and 390×844:
confirmed clicking elsewhere on the detail screen no longer advances, the
button does, and the button renders correctly (blue fill, no horizontal
overflow on phone — checked `scrollWidth === innerWidth` directly, not just
eyeballed a screenshot, since a mid-animation screenshot briefly looks
truncated for reasons unrelated to layout).

**Citation:** [`53ea586`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/53ea586)

**Caution:** the same "tap anywhere" pattern still exists on the
complete/restart screen (`.screen-complete`, "tap anywhere to restart") —
explicitly out of scope for this pass, not yet reported as a problem, and not
fixed here.

---

### Added "Back to previous question," which gave `initBirdGame`'s cross-round chaining its first unit test coverage

**What happened:** requested feature: a button letting the visitor return to
the previous round's detail screen if they clicked Next before finishing
reading it. Implemented in `initBirdGame` (not `wireRound`) since it reaches
into a *different* round's DOM and mutates the shared `current` counter —
wiring that's inherently page-level. Returning from the peek needed no new
listener: the peeked round's own already-wired `detail-next` → `next()` →
`onAdvance()` chain closes over the same `current` variable the peek
decremented, so it naturally lands forward again exactly where the visitor
left off.

**Not just a feature add — closed a real coverage gap:** `renderFixture()` in
`spec/interaction.test.ts` has only ever built one `.round`, so
`initBirdGame`'s cross-round machinery (`current`, `showRound()`, the
`onAdvance` chaining between rounds) had zero unit coverage before this —
`f4c5b58`'s entry above notes it was only ever confirmed by inspecting the
built `dist/index.html` by eye. Added a second fixture,
`renderRoundsFixture(count)`, that renders N real rounds and drives
`initBirdGame` against all of them together, then used it to assert the
state-preservation claim the whole feature depends on directly: answering
round 0, advancing to round 1, peeking back, and asserting round 0's outcome
text is still `"Nice!"` — not re-derived, the literal string set by the
original answer. That fixture now exists for any future cross-round feature
to reuse, not just this one.

**How I knew it was right:** `pnpm check` green, 72/72 → 75/75 (3 new tests:
button hidden on round 0, visible after, and the full peek-forward-again
round trip). One stylelint fix needed along the way
(`declaration-block-no-redundant-longhand-properties` on the new
`.back-question` rule — collapsed separate `align-self`/`justify-self` into
`place-self: start`). Verified in a real browser at both 1920×1080 and
390×844 (same `LD_LIBRARY_PATH` Playwright workaround as `53ea586`): button
renders in the previously-empty top-left grid cell with no overlap or
horizontal overflow at either width, peeking shows round 0's original
outcome/feature/photo/notes untouched, and returning lands back on round 1's
still-unanswered guess screen.

**Citation:** [`3868b66`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/3868b66)

**Caution:** no `setEntry`/`enter-from-*` animation plays on the peek
transition itself (only the return leg is animated, for free, via the
unchanged `next()` path) — deliberate, since there's no swipe/keypress
direction to reflect for a button click, but not verified against every
possible stale-animation-class edge case beyond the one scenario driven above.

---

### The mandated phone-viewport pass caught a latent flex-basis bug the static marker script structurally can't see

**What happened:** requested a detail-screen redesign (split answer/confusable
into separate panels, prominent outcome banner, a second top-right Next
button, whole-page nature-app reskin). Before committing, ran the
CLAUDE.md-mandated real-browser pass at both graded viewports — a rule this
same body of work had already written into CLAUDE.md's "Verifying
detail-photo markers" section specifically because `verify:markers`'s
pixels-only composite can't exercise leader lines or the confusable dropdown,
both of which depend on real (`ResizeObserver`-driven) layout. Desktop
(1920×1080) looked correct. At 390×844, two annotation rings rendered in
blank space below their photos instead of on them.

**Root cause, and why no static check could have caught it:** `flex-basis`
always applies to the flex container's *main axis*. `.annotated-photo-frame`'s
`flex: 1 1 16rem` is a sensible min-*width* in the desktop row layout, but the
`@media (width <= 30rem)` breakpoint flips `.annotated-photo` to
`flex-direction: column`, silently turning that same value into a min-*height*
— stretching the frame taller than the rendered photo. `.annotation-circle`
positions by `top: Y%` against the frame's box, so any ring below the photo's
true bottom edge landed in that dead space. This bug was latent in the
leader-line feature's original mobile CSS from the start (`ecada1d`) — nothing
about this redesign introduced it; this redesign's browser pass is just the
first time anyone actually looked at that breakpoint with real annotation data
in it, because `verify:markers` composites onto the photo directly and has no
concept of a CSS breakpoint at all.

**Fix:** added `.annotated-photo-frame { flex-basis: auto; }` inside the same
mobile media query, with a comment explaining the axis-flip so the next person
touching this breakpoint doesn't reintroduce it by "simplifying" the override
away.

**How I knew it was right:** re-screenshotted the same round at 390×844 after
the fix — both rings landed back on their photos, leader lines intact.
`pnpm check` re-run green after the CSS change (typecheck, build, oxlint,
stylelint, 191/191 tests). Also drove a multi-confusable round (Rufous-vented
Tit, 2 confusables) through `agent-browser` at both viewports: dropdown switch
redraws leader lines correctly, both Next buttons and the back-question button
work, `document.documentElement.scrollWidth === window.innerWidth` at both
1920 and 390 (no horizontal overflow).

**Citation:** [`3261608`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/3261608)
— the `.annotated-photo-frame { flex-basis: auto; }` fix and its explanatory
comment are in this commit's `global.css` diff.

**Caution — this is a check *validating itself*, not a new harness-level
moment:** the rule that caught this (real-browser pass at both viewports,
required before committing any round touching card layout) was already
written into CLAUDE.md in an earlier commit (`ecada1d`), not added or changed
here. No new automated check came out of finding this bug either — the fix is
inline CSS plus a comment, not a test. Log this as evidence the existing rule
earns its keep (a real, non-obvious, structurally-unstaticable-checkable bug,
caught only because the rule was followed), not as one of this deliverable's
few A1-original harness corrections.

---

### Chose a width-only photo cap to protect the annotation-ring invariant, and fully reverted the back-question feature's test contract

**What happened:** five independent UI adjustments requested in one pass:
shrink the FeatureCard photo to match the guess-screen photo's size, revert
the guess-screen options from a pill back to a rounded rectangle, add subtle
bird-themed decoration, remove the back-question feature entirely, and make
the confusable panel collapsed-by-default. The first and fourth of these
were the ones that touched the harness; the other three (shape, decoration,
default-collapsed markup) were style/markup changes under an unchanged
contract and aren't logged as separate moments here.

**Rejected the literal reading of the sizing request to protect an existing
invariant:** "match the image dimensions on the guess screen" literally
means matching width *and* height, which for a differently-proportioned
photo means cropping or letterboxing. `.annotation-circle` positions rings
by `left/top: N%`, correct only because `.feature-photo` is shown at its
natural aspect ratio (documented in `global.css` and in the "Verifying
detail-photo markers" CLAUDE.md section) — boxing the photo to a foreign
aspect ratio would break that percentage math for every one of ~25 marker
cards, not just the ones touched here. Surfaced this conflict via
`AskUserQuestion` with three options (width-only cap / full W+H with
letterboxing / full W+H with cropping), naming the cost of the latter two
explicitly. User picked the width-only option, rejecting the literal
full-match reading. This is the harness-protecting decision — it kept the
"never crop/box `.feature-photo`" invariant intact without re-verifying
every marker card, rather than "closest to what was asked."

**Task 4 was a full revert of both the feature and its test contract, not a
hide:** deleted the `.back-question` button, its `birds.ts` cross-round
wiring, its CSS — and also deleted `spec/interaction.test.ts`'s dedicated
3-test `describe("back to previous question", ...)` block, replacing it with
a single trimmed test that keeps only the still-relevant cross-round
`current`/`showRound()` coverage `renderRoundsFixture` was built for. The
spec no longer asserts back-navigation exists at all — the contract changed
shape to match the reversed feature decision, not just the code.

**How I knew it was right:** `pnpm check` green at 189/189 throughout.
`pnpm verify:markers` re-run and reasoned (not just assumed) that a CSS-only
`max-width` cap can't affect its output, since it composites directly onto
source photo pixels independent of display CSS — a deliberate, justified
skip of the usual "review every preview" step, not a shortcut taken blind.
`agent-browser` pass at both 1920×1080 and 390×844 confirmed: feature-photo
width equals the fixed 13.25rem cap (212px, matching the guess-screen photo
at desktop where the cap was measured); rings still land correctly at both
sizes; the confusable panel opens closed (`.confusable-section.open ===
false` on a fresh round) and leader lines redraw correctly on first expand
and on a subsequent dropdown switch (multi-confusable round); no
back-question button anywhere; no horizontal overflow at either viewport.

**Citation:** [`7a93692`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/7a93692)
(width cap + shape + decoration), [`985a2ee`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/985a2ee)
(back-question full revert, including the `spec/interaction.test.ts` contract
change), [`58901ce`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/58901ce)
(collapsed-by-default confusable panel).

**Caution:** the width-only cap is a fixed rem value (13.25rem) measured
once at 1920×1080, not a responsive computation — at 390×844 the
guess-screen photo itself shrinks further (to ~117px, driven by `.board`'s
own grid math at that viewport) while the feature-photo cap stays at 212px,
so the two aren't pixel-identical at every viewport, only at the one they
were measured against. This was the explicitly approved tradeoff (the plan
said "hard-code the pixel-equivalent rem value measured live"), not an
oversight, and the phone screenshot still reads as proportionate rather than
oversized — but it's worth naming plainly rather than letting "matches the
guess screen" stand unqualified.

### Found the actual coordinate-space bug behind "messy leader lines" instead of re-tuning line styling

The user reported the leader lines connecting each annotation circle to its
label were messy, seemingly tuned only for mobile, and cluttered on phone —
plus that the circles were too big and covered the photo. The instinct-fix
would have been styling (thinner strokes, smaller circles) and maybe a
media-query special case for the line-drawing math. Reading
`leader-lines.ts` and `FeatureCard.astro` together instead of just the CSS
found the real cause: the `<svg class="annotation-lines">` element lived
*inside* `.annotated-photo-frame` (CSS gave it `inset: 0`, sizing it to the
photo alone), while `layout()` computed its `viewBox` from the *outer*
`.annotated-photo` row/column — the same element that also holds the
separate label list. Rendered-box and viewBox disagreeing triggered the
SVG's default `preserveAspectRatio` scaling, which non-uniformly squished
every line's coordinates. The mismatch's severity differs by layout
direction (row on desktop vs. the narrow-viewport column flip), which is
exactly why it looked mobile-specific and looked different-but-still-broken
on desktop — one bug, viewport-dependent symptoms.

The fix moved the svg to be the *last* sibling of `.annotated-photo` instead
(so it visually spans the same box `layout()` already measures, and paints
over both the frame and the label list) and added `position: relative` to
`.annotated-photo` so that `inset: 0` resolves against it. No changes were
needed to the coordinate math in `leader-lines.ts` itself — it was already
written assuming this geometry; the bug was that the markup nested the svg
one level too deep. Circles were separately shrunk (1.5rem → 0.85rem) and
the number removed from inside them, since a working line-to-label
connection makes the in-circle number redundant, and the smaller ring
covers less of the photo.

**Why this belongs here and not just as a styling tweak:** the fix changes
what the two files' contract with each other actually *is* — `viewBox` and
every `getBoundingClientRect()` delta in `leader-lines.ts` are now measured
against the same ancestor the svg's CSS box actually spans, a coordinate-
space invariant that wasn't true before and wasn't tested by anything
mechanical (`rounds.test.ts` only checks stored `x`/`y` percentages, never
runtime line rendering). Caught by reading the two files together against
the CSS, then confirmed with `agent-browser` at both graded viewports
(desktop `viewBox` now equals its rendered box exactly; mobile column layout
draws correctly to the label under each ring; the confusable-panel
first-expand and dropdown-switch redraws — the two cases the CSS composite
in `verify:markers` can't exercise — both still worked).

**Citation:** [`284c881`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/284c881).
