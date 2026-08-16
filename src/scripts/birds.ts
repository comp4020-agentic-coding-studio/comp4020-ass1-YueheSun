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

function wireRound(round: HTMLElement): void {
  const options = Array.from(
    round.querySelectorAll<HTMLElement>('[data-testid="option"]'),
  );
  const correct = options.find((option) => option.dataset.correct === "true");
  const feedback = round.querySelector<HTMLElement>('[data-testid="feedback"]');
  const reveal = round.querySelector<HTMLElement>('[data-testid="reveal"]');
  if (!correct || !feedback || !reveal) return;

  const revealField = (name: string) =>
    reveal.querySelector<HTMLElement>(`[data-testid="reveal-${name}"]`);

  function choose(position: Direction): void {
    if (position === correct!.dataset.position) {
      feedback!.textContent = "Nice!";
      reveal!.hidden = true;
      return;
    }
    feedback!.textContent = "";
    const species = revealField("species");
    const feature = revealField("feature");
    const notes = revealField("notes");
    if (species) species.textContent = correct!.dataset.name ?? "";
    if (feature) feature.textContent = correct!.dataset.feature ?? "";
    if (notes) notes.textContent = correct!.dataset.notes ?? "";
    reveal!.hidden = false;
  }

  function dismiss(): void {
    reveal!.hidden = true;
    feedback!.textContent = "";
  }

  for (const option of options) {
    const position = option.dataset.position as Direction | undefined;
    if (position) option.addEventListener("click", () => choose(position));
  }

  round.addEventListener("keydown", (event) => {
    const direction = ARROW_TO_DIRECTION[(event as KeyboardEvent).key];
    if (direction) choose(direction);
  });

  let swipeStart: { x: number; y: number } | null = null;
  round.addEventListener("pointerdown", (event) => {
    const { clientX, clientY } = event as PointerEvent;
    swipeStart = { x: clientX, y: clientY };
  });
  round.addEventListener("pointerup", (event) => {
    if (!swipeStart) return;
    const { clientX, clientY } = event as PointerEvent;
    const direction = directionFromSwipe(clientX - swipeStart.x, clientY - swipeStart.y);
    swipeStart = null;
    if (direction) choose(direction);
  });

  reveal.addEventListener("click", dismiss);
  reveal.addEventListener("keydown", (event) => {
    const key = (event as KeyboardEvent).key;
    if (key === "Enter" || key === " ") dismiss();
  });
}

export function initBirdGame(root: Document): void {
  for (const round of root.querySelectorAll<HTMLElement>('[data-testid="round"]')) {
    wireRound(round);
  }
}
