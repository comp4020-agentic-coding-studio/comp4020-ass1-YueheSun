const DIRECTIONS = ["top", "bottom", "left", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];

const ARROW_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "top",
  ArrowDown: "bottom",
  ArrowLeft: "left",
  ArrowRight: "right",
};

// Below this many pixels of movement, treat a pointerdown/pointerup pair as
// a tap (handled by "click" instead), not a swipe.
const SWIPE_THRESHOLD_PX = 40;

function directionFromSwipe(dx: number, dy: number): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "bottom" : "top";
}

// The incoming screen enters from the opposite edge to the direction picked,
// so the motion reads as a continuation of the swipe/keypress that picked it
// (swipe left → next content arrives from the right), not a fixed direction.
const ENTRY_CLASSES = [
  "enter-from-left",
  "enter-from-right",
  "enter-from-top",
  "enter-from-bottom",
] as const;

const DIRECTION_TO_ENTRY: Record<Direction, (typeof ENTRY_CLASSES)[number]> = {
  left: "enter-from-right",
  right: "enter-from-left",
  top: "enter-from-bottom",
  bottom: "enter-from-top",
};

function setEntry(screen: HTMLElement, entryClass: string): void {
  screen.classList.remove(...ENTRY_CLASSES);
  screen.classList.add(entryClass);
}

function wireRound(round: HTMLElement, onAdvance: () => void): void {
  const options = Array.from(
    round.querySelectorAll<HTMLElement>('[data-testid="option"]'),
  );
  const correct = options.find((option) => option.dataset.correct === "true");
  const guessScreen = round.querySelector<HTMLElement>('[data-testid="screen-guess"]');
  const detailScreen = round.querySelector<HTMLElement>('[data-testid="screen-detail"]');
  const outcome = round.querySelector<HTMLElement>('[data-testid="outcome"]');
  const detailFeature = round.querySelector<HTMLElement>('[data-testid="detail-feature"]');
  const detailNotes = round.querySelector<HTMLElement>('[data-testid="detail-notes"]');
  const detailPhoto = round.querySelector<HTMLImageElement>('[data-testid="detail-photo"]');
  const mysteryPhoto = round.querySelector<HTMLImageElement>('[data-testid="mystery-photo"]');
  if (!correct || !guessScreen || !detailScreen || !outcome || !detailFeature || !detailNotes) {
    return;
  }

  const doc = round.ownerDocument;
  const isGuessing = () => !guessScreen.hidden;
  let lastEntry: string = DIRECTION_TO_ENTRY.right;

  function showDetail(isCorrect: boolean, direction: Direction): void {
    outcome!.textContent = isCorrect ? "Nice!" : `So close! It's the ${correct!.dataset.name}.`;
    detailFeature!.textContent = correct!.dataset.feature ?? "";
    detailNotes!.textContent = correct!.dataset.notes ?? "";
    if (detailPhoto && mysteryPhoto) {
      detailPhoto.src = mysteryPhoto.src;
      detailPhoto.alt = `${correct!.dataset.name} — showing ${correct!.dataset.feature}`;
    }
    lastEntry = DIRECTION_TO_ENTRY[direction];
    setEntry(detailScreen!, lastEntry);
    guessScreen!.hidden = true;
    detailScreen!.hidden = false;
  }

  function next(): void {
    // Continues in the same direction that led into this detail screen,
    // rather than reversing it, so a full guess→detail→next cycle reads as
    // one motion, not a slide-in followed by a slide-back.
    setEntry(guessScreen!, lastEntry);
    detailScreen!.hidden = true;
    guessScreen!.hidden = false;
    onAdvance();
  }

  function choose(position: Direction): void {
    if (!isGuessing()) return;
    showDetail(position === correct!.dataset.position, position);
  }

  for (const option of options) {
    const position = option.dataset.position as Direction | undefined;
    if (position) option.addEventListener("click", () => choose(position));
  }

  // Listens on `document`, not `round`: keydown only bubbles up from
  // whatever element currently has focus, and nothing inside `round` is
  // focused by default, so a round-scoped listener would silently miss
  // every key press until the visitor happened to click something first.
  doc.addEventListener("keydown", (event) => {
    // Every round in a multi-round page wires its own document-level
    // listener, so a listener whose round isn't the one currently on screen
    // (hidden by initBirdGame's round-to-round advance) must ignore the
    // event — otherwise every not-yet-reached round would react to the same
    // key press at once.
    if (round.hidden) return;
    const key = (event as KeyboardEvent).key;
    if (isGuessing()) {
      const direction = ARROW_TO_DIRECTION[key];
      if (direction) choose(direction);
    } else if (key === "Enter" || key === " ") {
      next();
    }
  });

  let swipeStart: { x: number; y: number } | null = null;
  doc.addEventListener("pointerdown", (event) => {
    if (round.hidden || !isGuessing()) return;
    const { clientX, clientY } = event as PointerEvent;
    swipeStart = { x: clientX, y: clientY };
  });
  doc.addEventListener("pointerup", (event) => {
    if (round.hidden || !swipeStart) return;
    const { clientX, clientY } = event as PointerEvent;
    const direction = directionFromSwipe(clientX - swipeStart.x, clientY - swipeStart.y);
    swipeStart = null;
    if (direction) choose(direction);
  });

  detailScreen.addEventListener("click", next);
}

export function initBirdGame(root: Document): void {
  const rounds = Array.from(root.querySelectorAll<HTMLElement>('[data-testid="round"]'));
  const complete = root.querySelector<HTMLElement>('[data-testid="complete"]');
  let current = 0;

  function showRound(index: number): void {
    rounds.forEach((round, i) => {
      round.hidden = i !== index;
    });
    if (complete) complete.hidden = true;
  }

  function showComplete(): void {
    rounds.forEach((round) => {
      round.hidden = true;
    });
    if (complete) complete.hidden = false;
  }

  function restart(): void {
    current = 0;
    showRound(current);
  }

  for (const round of rounds) {
    wireRound(round, () => {
      current += 1;
      if (current >= rounds.length) {
        showComplete();
      } else {
        showRound(current);
      }
    });
  }

  if (rounds.length > 0) showRound(current);

  complete?.addEventListener("click", restart);
  root.addEventListener("keydown", (event) => {
    if (!complete || complete.hidden) return;
    const key = (event as KeyboardEvent).key;
    if (key === "Enter" || key === " ") restart();
  });
}
