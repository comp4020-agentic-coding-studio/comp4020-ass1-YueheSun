// Spec line: "the visitor does something that changes what they see."
// Contract for this prototype: a mystery-bird photo with four options placed
// top/bottom/left/right. The visitor picks one by tap/click, by an arrow key,
// or by a swipe — a phone swipes, a desktop presses arrow keys, and either
// should also just be tappable, so all three paths are asserted here. A
// correct pick shows "Nice!" in place; a wrong pick reveals the correct
// species, the one feature that actually distinguishes it, and brief
// supporting notes (habitat/behaviour) below that feature. Background music
// is deliberately not asserted here: it's ambient mood-setting, independent
// of whether the pick was right or wrong, so it isn't part of this
// interaction contract. This drives `initBirdGame` against a markup fixture;
// it doesn't care how the real page is built, only that this contract holds.
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { initBirdGame } from "../src/scripts/birds";

const NEXT_STEP =
  "Implement initBirdGame() in src/scripts/birds.ts, or rewrite this test if your interaction contract has changed.";

function renderFixture() {
  const dom = new JSDOM(
    `
    <section data-testid="round">
      <img src="mystery.jpg" alt="Mystery bird" />
      <button data-testid="option" data-position="top" data-name="Azure-winged Magpie"></button>
      <button data-testid="option" data-position="bottom" data-name="Eurasian Tree Sparrow"></button>
      <button data-testid="option" data-position="left" data-name="Light-vented Bulbul"
              data-correct="true"
              data-feature="pale grey-white patch behind the eye"
              data-notes="common in parks and gardens; noisy and gregarious, eats fruit and insects"></button>
      <button data-testid="option" data-position="right" data-name="Oriental Magpie-Robin"></button>
      <p data-testid="feedback"></p>
      <div data-testid="reveal" hidden>
        <p data-testid="reveal-species"></p>
        <p data-testid="reveal-feature"></p>
        <p data-testid="reveal-notes"></p>
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
    feedback: document.querySelector<HTMLElement>('[data-testid="feedback"]')!,
    reveal: document.querySelector<HTMLElement>('[data-testid="reveal"]')!,
  };
}

describe("bird identification game", () => {
  it("shows no feedback and keeps the reveal hidden before any choice", () => {
    const { feedback, reveal } = renderFixture();
    expect(feedback.textContent?.trim(), NEXT_STEP).toBe("");
    expect(reveal.hidden).toBe(true);
  });

  it("shows positive feedback when the visitor taps the correct option", () => {
    const { window, option, feedback, reveal } = renderFixture();
    option("left").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(feedback.textContent, NEXT_STEP).toContain("Nice!");
    expect(reveal.hidden).toBe(true);
  });

  it("reveals the correct species, its feature, and its notes on a wrong tap", () => {
    const { window, option, reveal } = renderFixture();
    option("top").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(reveal.hidden, NEXT_STEP).toBe(false);
    expect(reveal.querySelector('[data-testid="reveal-species"]')?.textContent).toContain(
      "Light-vented Bulbul",
    );
    expect(reveal.querySelector('[data-testid="reveal-feature"]')?.textContent).toContain(
      "pale grey-white patch",
    );
    expect(reveal.querySelector('[data-testid="reveal-notes"]')?.textContent).toContain(
      "common in parks",
    );
  });

  it("also accepts the correct answer via arrow key, so it works without a touchscreen (desktop)", () => {
    const { window, round, feedback } = renderFixture();
    round.dispatchEvent(
      new window.KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }),
    );
    expect(feedback.textContent, NEXT_STEP).toContain("Nice!");
  });

  it("also accepts the correct answer via swipe, so it works without a keyboard (phone)", () => {
    const { window, round, feedback } = renderFixture();
    round.dispatchEvent(
      new window.PointerEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 200 }),
    );
    round.dispatchEvent(
      new window.PointerEvent("pointerup", { bubbles: true, clientX: 0, clientY: 200 }),
    );
    expect(feedback.textContent, NEXT_STEP).toContain("Nice!");
  });
});
