// Wires up the tap/swipe/arrow-key directional guessing game that
// spec/interaction.test.ts drives. Not implemented yet — the test is red
// against this on purpose.
// TODO: for each [data-testid="round"], read its four [data-testid="option"]
// children (each carries data-position "top"/"bottom"/"left"/"right" and
// data-name; the correct one also carries data-correct="true",
// data-feature, and data-notes). Resolve a chosen position from three input
// paths — click/tap on an option, keydown of ArrowUp/Down/Left/Right, and a
// pointerdown->pointerup swipe past a distance threshold — and compare it to
// the correct option's position:
//   - match: show "Nice!" in [data-testid="feedback"], leave
//     [data-testid="reveal"] hidden.
//   - mismatch: fill [data-testid="reveal-species"/"reveal-feature"/
//     "reveal-notes"] from the correct option's data-name/data-feature/
//     data-notes and un-hide [data-testid="reveal"].
export function initBirdGame(_root: Document): void {}
