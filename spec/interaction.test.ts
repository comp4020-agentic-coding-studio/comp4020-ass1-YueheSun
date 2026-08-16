// Spec line: "the visitor does something that changes what they see."
// Contract for this prototype: a mystery-bird photo with four options placed
// top/bottom/left/right. The visitor picks one by tap/click, by an arrow key,
// or by a swipe — a phone swipes, a desktop presses arrow keys, and either
// should also just be tappable, so all three paths are asserted here. Any
// pick — right or wrong — jumps straight to a detail screen: an outcome
// chip ("Nice!" or "So close!", styled via outcome-correct/outcome-wrong,
// deliberately never naming the species inline — that's what the feature
// cards below it are for, static Astro output this fixture doesn't need to
// exercise), then a dedicated "Next" button (data-testid="detail-next").
// Advancing requires hitting that button (or Enter/Space, since a real
// <button> gets that for free) — tapping elsewhere on the detail screen must
// NOT advance, which used to be the contract and turned out to be too easy
// to trigger by accident while just reading the photo/notes. The transition
// into the detail screen mirrors the direction that was picked (swipe/press
// left → arrives from the right), so that's asserted too via the
// `enter-from-*` class it applies.
// The keyboard and swipe tests below deliberately dispatch their events on
// `document`, not on `round`: keydown only bubbles up from whatever element
// currently has focus, and nothing in this fixture is focused by default, so
// a listener wrongly scoped to `round` would still pass a test that dispatched
// straight at `round` (dispatching at a target reaches its own listeners
// regardless of focus) while still being broken for a real visitor who hasn't
// clicked anything yet. Dispatching from `document` instead reproduces that
// real condition, so this test only passes if the fix (listening on
// `round.ownerDocument`) is actually in place.
// Background music is deliberately not asserted here: it's ambient
// mood-setting, independent of whether the pick was right or wrong, so it
// isn't part of this interaction contract.
// This drives `initBirdGame` against a markup fixture; it doesn't care how
// the real page is built, only that this contract holds.
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { initBirdGame } from "../src/scripts/birds";

const NEXT_STEP =
  "Implement initBirdGame() in src/scripts/birds.ts, or rewrite this test if your interaction contract has changed.";

function renderFixture() {
  const dom = new JSDOM(
    `
    <section data-testid="round">
      <div data-testid="screen-guess">
        <button data-testid="back-question" type="button">Back to previous question</button>
        <img data-testid="mystery-photo" src="mystery.jpg" alt="Mystery bird" />
        <button data-testid="option" data-position="top" data-name="Azure-winged Magpie"></button>
        <button data-testid="option" data-position="bottom" data-name="Eurasian Tree Sparrow"></button>
        <button data-testid="option" data-position="left" data-name="Light-vented Bulbul"
                data-correct="true"></button>
        <button data-testid="option" data-position="right" data-name="Oriental Magpie-Robin"></button>
      </div>
      <div data-testid="screen-detail" hidden>
        <p data-testid="outcome"></p>
        <button data-testid="detail-next" type="button">Next</button>
        <button data-testid="detail-next" type="button">Next</button>
      </div>
    </section>
  `,
    { pretendToBeVisual: true },
  );
  const { window } = dom;
  const { document } = window;
  initBirdGame(document);
  return {
    window,
    round: document.querySelector<HTMLElement>('[data-testid="round"]')!,
    option: (position: string) =>
      document.querySelector<HTMLElement>(
        `[data-testid="option"][data-position="${position}"]`,
      )!,
    guessScreen: document.querySelector<HTMLElement>('[data-testid="screen-guess"]')!,
    detailScreen: document.querySelector<HTMLElement>('[data-testid="screen-detail"]')!,
    outcome: document.querySelector<HTMLElement>('[data-testid="outcome"]')!,
    // The real page renders two of these (top and bottom of a long detail
    // screen) — this fixture mirrors that so the "either one advances" case
    // below has something real to exercise.
    detailNext: document.querySelector<HTMLElement>('[data-testid="detail-next"]')!,
    detailNextButtons: Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="detail-next"]'),
    ),
  };
}

describe("bird identification game", () => {
  it("shows the guess screen and keeps the detail screen hidden before any choice", () => {
    const { guessScreen, detailScreen } = renderFixture();
    expect(guessScreen.hidden, NEXT_STEP).toBe(false);
    expect(detailScreen.hidden).toBe(true);
  });

  it("jumps to the detail screen with a positive outcome chip when the visitor taps the correct option", () => {
    const { window, option, guessScreen, detailScreen, outcome } = renderFixture();
    option("left").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(guessScreen.hidden, NEXT_STEP).toBe(true);
    expect(detailScreen.hidden).toBe(false);
    expect(outcome.textContent).toContain("Nice!");
    expect(outcome.classList.contains("outcome-correct"), NEXT_STEP).toBe(true);
    expect(outcome.classList.contains("outcome-wrong")).toBe(false);
  });

  it("jumps to the detail screen with a 'so close' outcome chip that doesn't name the species inline on a wrong tap", () => {
    const { window, option, detailScreen, outcome } = renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden, NEXT_STEP).toBe(false);
    expect(outcome.textContent).toContain("So close!");
    // The species name now lives in the feature card below, not the outcome
    // line — that's the actual point of this change (readability: the old
    // "So close! It's the X." sentence was hard to read).
    expect(outcome.textContent).not.toContain("Light-vented Bulbul");
    expect(outcome.classList.contains("outcome-wrong"), NEXT_STEP).toBe(true);
    expect(outcome.classList.contains("outcome-correct")).toBe(false);
  });

  it("accepts an arrow key with no prior click/focus inside the round, so it works from a cold page load (desktop)", () => {
    const { window, detailScreen, outcome } = renderFixture();
    // Dispatched on `document`, not `round` — see file-header comment. A
    // listener wrongly scoped to `round` would miss this.
    window.document.dispatchEvent(
      new window.KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }),
    );
    expect(detailScreen.hidden, NEXT_STEP).toBe(false);
    expect(outcome.textContent).toContain("Nice!");
  });

  it("accepts a swipe with no prior click/focus inside the round, so it works from a cold page load (phone)", () => {
    const { window, detailScreen, outcome } = renderFixture();
    window.document.dispatchEvent(
      new window.PointerEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 200 }),
    );
    window.document.dispatchEvent(
      new window.PointerEvent("pointerup", { bubbles: true, clientX: 0, clientY: 200 }),
    );
    expect(detailScreen.hidden, NEXT_STEP).toBe(false);
    expect(outcome.textContent).toContain("Nice!");
  });

  it("animates the detail screen in from the opposite edge to the direction picked", () => {
    const { window, option, detailScreen } = renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.classList.contains("enter-from-bottom"), NEXT_STEP).toBe(true);
  });

  it("animates the guess screen back in from that same edge on 'Next', continuing the motion rather than reversing it", () => {
    const { window, option, guessScreen, detailNext } = renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    detailNext.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(guessScreen.classList.contains("enter-from-bottom"), NEXT_STEP).toBe(true);
  });

  it("returns to the guess screen on clicking the dedicated Next button", () => {
    const { window, option, guessScreen, detailScreen, detailNext } = renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden).toBe(false);
    detailNext.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden, NEXT_STEP).toBe(true);
    expect(guessScreen.hidden).toBe(false);
  });

  it("advances on either Next button — the detail screen renders one at the top and one at the bottom, and both must work", () => {
    const { window, option, guessScreen, detailScreen, detailNextButtons } = renderFixture();
    expect(detailNextButtons.length, NEXT_STEP).toBe(2);
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden).toBe(false);
    detailNextButtons[1]!.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden, NEXT_STEP).toBe(true);
    expect(guessScreen.hidden).toBe(false);
  });

  it("does NOT advance on a tap elsewhere on the detail screen — only the Next button should", () => {
    const { window, option, detailScreen } = renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden).toBe(false);
    detailScreen.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(
      detailScreen.hidden,
      "A tap anywhere on the detail screen used to advance — that was too easy to " +
        "trigger by accident. Only the dedicated Next button should now.",
    ).toBe(false);
  });
});

// initBirdGame's per-round wiring (wireRound) is already covered end-to-end
// via renderFixture() above. This fixture exists only to exercise the
// cross-round machinery that requires more than one round to be present:
// `current`, showRound(), and the back-question button's reach into a
// *different* round's DOM.
function roundMarkup(n: number): string {
  return `
    <section data-testid="round">
      <div data-testid="screen-guess">
        <button data-testid="back-question" type="button">Back to previous question</button>
        <img data-testid="mystery-photo" src="mystery-${n}.jpg" alt="Mystery bird" />
        <button data-testid="option" data-position="top" data-name="Decoy Top ${n}"></button>
        <button data-testid="option" data-position="bottom" data-name="Decoy Bottom ${n}"></button>
        <button data-testid="option" data-position="left" data-name="Correct Bird ${n}"
                data-correct="true"></button>
        <button data-testid="option" data-position="right" data-name="Decoy Right ${n}"></button>
      </div>
      <div data-testid="screen-detail" hidden>
        <p data-testid="outcome"></p>
        <button data-testid="detail-next" type="button">Next</button>
      </div>
    </section>
  `;
}

function renderRoundsFixture(count: number) {
  const dom = new JSDOM(
    `<main>${Array.from({ length: count }, (_, i) => roundMarkup(i)).join("")}</main>`,
    { pretendToBeVisual: true },
  );
  const { window } = dom;
  const { document } = window;
  initBirdGame(document);
  const rounds = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="round"]'));
  const within = (i: number, testid: string) =>
    rounds[i].querySelector<HTMLElement>(`[data-testid="${testid}"]`)!;
  return { window, rounds, within };
}

describe("back to previous question", () => {
  it("hides the back-question button on the very first round, since there's nothing before it", () => {
    const { within } = renderRoundsFixture(2);
    expect(within(0, "back-question").hidden, NEXT_STEP).toBe(true);
  });

  it("shows the back-question button on every round after the first", () => {
    const { within } = renderRoundsFixture(2);
    expect(within(1, "back-question").hidden, NEXT_STEP).toBe(false);
  });

  it("lets the visitor step back to see the previous round's detail screen again, with its original outcome preserved, then forward again to exactly where they left off", () => {
    const { window, rounds, within } = renderRoundsFixture(2);

    // Answer round 0 correctly, then advance to round 1 the normal way —
    // this reproduces the exact scenario in the feature request: the
    // visitor clicked Next before finishing reading round 0's detail screen.
    const correctOption = rounds[0].querySelector<HTMLElement>('[data-position="left"]')!;
    correctOption.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(within(0, "outcome").textContent).toContain("Nice!");
    within(0, "detail-next").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    // Now on round 1's guess screen.
    expect(rounds[0].hidden, NEXT_STEP).toBe(true);
    expect(rounds[1].hidden).toBe(false);
    expect(within(1, "screen-guess").hidden).toBe(false);

    // Peek back at round 0's detail screen.
    within(1, "back-question").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(rounds[0].hidden, NEXT_STEP).toBe(false);
    expect(rounds[1].hidden).toBe(true);
    expect(within(0, "screen-guess").hidden).toBe(true);
    expect(within(0, "screen-detail").hidden).toBe(false);
    // The outcome text is never cleared by showDetail()/next() — this is the
    // state-preservation claim the whole feature relies on, asserted directly.
    expect(within(0, "outcome").textContent).toContain("Nice!");

    // Return via round 0's own (already-wired) Next button — no dedicated
    // "return" listener exists; this exercises the same onAdvance() closure
    // that originally advanced from round 0 to round 1.
    within(0, "detail-next").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(rounds[1].hidden, NEXT_STEP).toBe(false);
    expect(rounds[0].hidden).toBe(true);
    // Round 1 was never touched during the peek: still on its own untouched
    // guess screen, not accidentally answered or advanced past.
    expect(within(1, "screen-guess").hidden).toBe(false);
    expect(within(1, "screen-detail").hidden).toBe(true);
  });
});
