// Wires up the hover/tap-to-reveal interaction that spec/interaction.test.ts
// drives. Not implemented yet — the test is red against this on purpose.
// TODO: for each [data-testid="bird"], on "mouseenter" AND "pointerdown",
// fill its [data-testid="bird-info"] child from the bird's data-name,
// data-feature, data-distribution attributes. Both events matter: hover
// alone doesn't fire on a phone, which has no cursor (spec line 3).
export function initBirdCards(_root: Document): void {}
