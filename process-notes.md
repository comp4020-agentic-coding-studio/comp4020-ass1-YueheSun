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
