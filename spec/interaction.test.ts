// Spec line: "the visitor does something that changes what they see."
// Contract for this prototype: hovering OR tapping a bird reveals its info.
// Hover-only would fail the other spec line ("works at both marking
// viewports") — a phone has no cursor to hover with — so both paths are
// asserted here. This drives `initBirdCards` against a markup fixture; it
// doesn't care how the real page is built, only that this contract holds.
// Rename the fixture markup and `initBirdCards` freely — keep the assertions.
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { initBirdCards } from "../src/scripts/birds";

const NEXT_STEP =
  "Implement initBirdCards() in src/scripts/birds.ts, or rewrite this test if your interaction contract has changed.";

function renderFixture() {
  const dom = new JSDOM(`
    <ul>
      <li data-testid="bird"
          data-name="Superb Fairywren"
          data-feature="tiny, bright blue tail"
          data-distribution="south-eastern Australia">
        <img src="fairywren.jpg" alt="Superb Fairywren" />
        <p data-testid="bird-info"></p>
      </li>
    </ul>
  `);
  const { window } = dom;
  initBirdCards(window.document);
  return {
    window,
    bird: window.document.querySelector<HTMLElement>('[data-testid="bird"]')!,
    info: window.document.querySelector<HTMLElement>('[data-testid="bird-info"]')!,
  };
}

describe("bird info reveal", () => {
  it("shows no info before any interaction", () => {
    const { info } = renderFixture();
    expect(info.textContent?.trim(), NEXT_STEP).toBe("");
  });

  it("reveals the bird's info on hover", () => {
    const { window, bird, info } = renderFixture();
    bird.dispatchEvent(new window.MouseEvent("mouseenter", { bubbles: true }));
    expect(info.textContent, NEXT_STEP).toContain("Superb Fairywren");
    expect(info.textContent).toContain("tiny, bright blue tail");
    expect(info.textContent).toContain("south-eastern Australia");
  });

  it("also reveals the bird's info on tap, so it works without a cursor (phone)", () => {
    const { window, bird, info } = renderFixture();
    bird.dispatchEvent(new window.PointerEvent("pointerdown", { bubbles: true }));
    expect(info.textContent, NEXT_STEP).toContain("Superb Fairywren");
  });
});
