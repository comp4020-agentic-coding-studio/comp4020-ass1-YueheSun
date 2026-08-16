// Spec line: "the visitor does something that changes what they see."
// Contract for this prototype: a mystery-bird photo with four options placed
// top/bottom/left/right. The visitor picks one by tap/click, by an arrow key,
// or by a swipe — a phone swipes, a desktop presses arrow keys, and either
// should also just be tappable, so all three paths are asserted here. Any
// pick — right or wrong — jumps straight to a detail screen: an outcome line
// ("Nice!" or "So close! It's the <species>."), then the one feature that
// actually distinguishes it, then the mystery photo again (now with an alt
// caption naming the bird), then a supporting habitat/behaviour note, then a
// dedicated "Next" button (data-testid="detail-next"). Advancing requires
// hitting that button (or Enter/Space, since a real <button> gets that for
// free) — tapping elsewhere on the detail screen must NOT advance, which used
// to be the contract and turned out to be too easy to trigger by accident
// while just reading the photo/notes. The transition into the detail screen
// mirrors the direction that was picked (swipe/press left → arrives from the
// right), so that's asserted too via the `enter-from-*` class it applies.
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
        <img data-testid="mystery-photo" src="mystery.jpg" alt="Mystery bird" />
        <button data-testid="option" data-position="top" data-name="Azure-winged Magpie"></button>
        <button data-testid="option" data-position="bottom" data-name="Eurasian Tree Sparrow"></button>
        <button data-testid="option" data-position="left" data-name="Light-vented Bulbul"
                data-correct="true"
                data-feature="pale grey-white patch behind the eye"
                data-notes="common in parks and gardens; noisy and gregarious, eats fruit and insects"></button>
        <button data-testid="option" data-position="right" data-name="Oriental Magpie-Robin"></button>
      </div>
      <div data-testid="screen-detail" hidden>
        <p data-testid="outcome"></p>
        <p data-testid="detail-feature"></p>
        <img data-testid="detail-photo" alt="" />
        <p data-testid="detail-notes"></p>
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
    detailFeature: document.querySelector<HTMLElement>('[data-testid="detail-feature"]')!,
    detailNotes: document.querySelector<HTMLElement>('[data-testid="detail-notes"]')!,
    detailPhoto: document.querySelector<HTMLImageElement>('[data-testid="detail-photo"]')!,
    detailNext: document.querySelector<HTMLElement>('[data-testid="detail-next"]')!,
  };
}

describe("bird identification game", () => {
  it("shows the guess screen and keeps the detail screen hidden before any choice", () => {
    const { guessScreen, detailScreen } = renderFixture();
    expect(guessScreen.hidden, NEXT_STEP).toBe(false);
    expect(detailScreen.hidden).toBe(true);
  });

  it("jumps to the detail screen with positive feedback when the visitor taps the correct option", () => {
    const { window, option, guessScreen, detailScreen, outcome } = renderFixture();
    option("left").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(guessScreen.hidden, NEXT_STEP).toBe(true);
    expect(detailScreen.hidden).toBe(false);
    expect(outcome.textContent).toContain("Nice!");
  });

  it("jumps to the detail screen naming the correct species, its feature, its photo, and its notes on a wrong tap", () => {
    const { window, option, detailScreen, outcome, detailFeature, detailNotes, detailPhoto } =
      renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden, NEXT_STEP).toBe(false);
    expect(outcome.textContent).toContain("Light-vented Bulbul");
    expect(detailFeature.textContent).toContain("pale grey-white patch");
    expect(detailNotes.textContent).toContain("common in parks");
    expect(detailPhoto.src).toContain("mystery.jpg");
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
