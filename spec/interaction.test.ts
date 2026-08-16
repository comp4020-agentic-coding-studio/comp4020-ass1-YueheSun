// Spec line: "the visitor does something that changes what they see."
// Contract for this prototype: a mystery-bird photo with four options placed
// top/bottom/left/right. The visitor picks one by tap/click, by an arrow key,
// or by a swipe — a phone swipes, a desktop presses arrow keys, and either
// should also just be tappable, so all three paths are asserted here. Any
// pick — right or wrong — jumps straight to a detail screen: an outcome line
// ("Nice!" or "So close! It's the <species>."), then the one feature that
// actually distinguishes it, then the mystery photo again (now with an alt
// caption naming the bird), then a supporting habitat/behaviour note. "Next"
// is any tap (or Enter/Space) anywhere on that detail screen — no separate
// button — and it carries button semantics (role/tabindex) so this is also
// keyboard-reachable, not tap-only. Background music is deliberately not
// asserted here: it's ambient mood-setting, independent of whether the pick
// was right or wrong, so it isn't part of this interaction contract.
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
      <div data-testid="screen-detail" role="button" tabindex="0" hidden>
        <p data-testid="outcome"></p>
        <p data-testid="detail-feature"></p>
        <img data-testid="detail-photo" alt="" />
        <p data-testid="detail-notes"></p>
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

  it("also accepts the correct answer via arrow key, so it works without a touchscreen (desktop)", () => {
    const { window, round, detailScreen, outcome } = renderFixture();
    round.dispatchEvent(
      new window.KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }),
    );
    expect(detailScreen.hidden, NEXT_STEP).toBe(false);
    expect(outcome.textContent).toContain("Nice!");
  });

  it("also accepts the correct answer via swipe, so it works without a keyboard (phone)", () => {
    const { window, round, detailScreen, outcome } = renderFixture();
    round.dispatchEvent(
      new window.PointerEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 200 }),
    );
    round.dispatchEvent(
      new window.PointerEvent("pointerup", { bubbles: true, clientX: 0, clientY: 200 }),
    );
    expect(detailScreen.hidden, NEXT_STEP).toBe(false);
    expect(outcome.textContent).toContain("Nice!");
  });

  it("returns to the guess screen on a tap anywhere on the detail screen — 'Next' is the detail screen itself", () => {
    const { window, option, guessScreen, detailScreen } = renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden).toBe(false);
    detailScreen.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(detailScreen.hidden, NEXT_STEP).toBe(true);
    expect(guessScreen.hidden).toBe(false);
  });
});
