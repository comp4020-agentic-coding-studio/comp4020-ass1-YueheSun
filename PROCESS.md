# Process overview

## What I built

"Spot the Difference: Bird Edition" --- a mystery-bird identification quiz built
around 12 real confusable-species comparisons from `data.md`. A photo is shown
with four species options placed top/bottom/left/right; the visitor picks one
by tap, arrow key, or swipe. Either answer jumps to a detail screen: an outcome
chip, then a feature card whose photo has every diagnostic feature ringed and
labelled (not just named in text), plus a "confused with" panel comparing it to
the species it's most often mistaken for. The core idea is that the interaction
*is* the explanation --- you see exactly where the distinguishing feature sits on
the actual photo, rather than reading a profile that happens to sit next to one.

## The moments that mattered

### 1. Changed the interaction contract before implementing the new interaction

The carried-forward prototype revealed a bird's name/feature/distribution on
hover-or-tap --- a field-guide pattern: symmetric treatment of many species, no
argument. Reframed the topic from "browse these birds" to "why you keep
misidentifying these look-alikes": a four-way guess, then a feature-first
reveal on a miss rather than a full profile. Instead of just writing new code
under the old contract, `spec/interaction.test.ts` was rewritten first to
assert the new one (four-way choice, three input paths, feature-first reveal),
and the stub renamed `initBirdCards` → `initBirdGame` to match --- the check
that defines "done" changed before the implementation existed. Confirmed this
was well-formed by running the suite against the still-empty stub: four of
five cases went red for the right reason (missing behaviour, not a broken
fixture), one passed, before any implementation was written.

**Citation:** [`ed8421d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/ed8421deab4d3af9c62d04c64a49f3f4d5048ecc)

### 2. Turned one-off photo corrections into a repeatable verification harness

Adding a marker (a ring pointing at exactly where a round's named feature is
visible) surfaced a much stronger test than "does this photo look roughly
right" --- it's impossible to mark a location that doesn't visually exist. That
test failed on 3 of 12 photos: the tail pattern, wing pattern, and throat
colour a photo claimed to show weren't actually visible in it. Rather than
patch those three and move on, asked directly whether this could become a
wired check instead of a one-off note. Proposed a two-tier design: a
mechanical bounds test plus a human-reviewed contact sheet. An intermediate
design was explored and explicitly rejected --- wiring a Claude-API vision
check into CI, to judge pixel content automatically --- because it needs a live
key with nowhere safe to keep it in a repo whose whole secrets sensor exists to
keep keys out of tracked files, is non-deterministic and costs money every CI
run, and a confident-but-wrong verdict is worse than no verdict at all once a
green check here gets trusted the way `pnpm check` is. Built `rounds.test.ts`
(mechanical bounds/attribution checks) and `scripts/verify-markers.ts` (a
contact sheet composited onto real source photos), plus a new `CLAUDE.md`
section making that human-eye pass a required step before committing any
round's photo or marker change. Later widened the same check to verify species
identity too, after a bug report claiming a photo showed the wrong species ---
the report turned out to be a false alarm on inspection, but the gap it named
(nothing checked species identity, only marker placement) was real, so the
check was extended anyway rather than dismissed along with the report.

**Citation:** [`752ab25`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/752ab25cfa69469a7e4e6fb7a8a7da147fe67fe5),
[`d4ca5d4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/d4ca5d4a1236261d30703522ed9031d6d3473ca6),
[`aafd0ad`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/aafd0adb8b7d030087f7fe3686d8618cde6de77d)

### 3. Reversed the detail-screen interaction contract after a usability report

The detail screen's "Next" affordance was the whole screen --- any tap on the
photo or notes advanced to the next round. Reported as too easy to trigger by
accident while just reading. Rather than adding a visible button alongside the
existing whole-screen handler (which would have left the accidental-advance
case intact), removed the click listener from the screen entirely and rewrote
the spec test that had asserted the old behaviour to assert its literal
opposite: a click on the detail screen must *not* advance, only a dedicated
`Next` button may. Same file, same suite, now enforcing the reverse contract.
Verified in a real browser at both graded viewports: clicking elsewhere no
longer advances, the button does, no layout overflow at either width.

**Citation:** [`53ea586`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/53ea586460cc3a14876d5db46c082f4641884375)

### 4. From a rendering bug to a layout rule that resolves cross-platform display issues

Leader lines connecting each annotation circle to its label read as messy and
cluttered on phone. The immediate cause was a coordinate-space bug: the line
layer's SVG computed its `viewBox` against a different box than the one it was
actually rendered against, triggering non-uniform scaling whose severity
happened to vary by viewport. Fixing that coordinate mismatch was necessary but
not sufficient --- the response to the fix was "still hard to read," because the
real constraint was architectural: a single stacked label column crowds and
crosses lines once a card has enough annotations (worst case in the data: 5, on
the shared Daurian Redstart card). Instead of another styling pass on the same
column (smaller font, tighter spacing), label placement was rewritten to assign
each label to one of two sides at runtime --- left/right split by x on desktop,
top/bottom split by y on mobile --- making overlap structurally impossible at
any annotation count, on either platform, rather than tuned away for today's
maximum. That constraint was written into `CLAUDE.md` as a named, enforceable
rule in the same commit as the code --- the Daurian Redstart card is now the
eyeball-check target whenever this layout changes --- so it is a standard
future work is checked against, not a decision that only lives in this
conversation. Verified with a real-browser pass at both 1920×1080 and 390×844,
including the confusable-panel first-expand and dropdown-switch redraws, and by
resizing live across the breakpoint in one open session to confirm the split
flips without a reload.

**Citation:** [`284c881`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/284c881185885273fbf556ef6d426e121c00a56c),
[`192e788`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YueheSun/commit/192e7883d93d026862f33073ad2998828b1b0fd9)
