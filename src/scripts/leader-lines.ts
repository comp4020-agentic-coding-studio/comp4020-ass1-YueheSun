// Draws the straight line connecting each annotation circle on a feature
// card's photo to its numbered label in the margin column. Circles and
// labels live in different coordinate spaces (the photo box vs. the margin
// column), so their line has to be measured against real rendered
// positions at runtime — it can't be hand-authored as fixed percentages,
// because a responsive reflow moves the two boxes independently.
//
// A ResizeObserver per card (not a window resize listener + image load
// listener) covers every case that needs a re-layout with one primitive:
// the image finishing loading (its box grows from nothing to its natural
// aspect ratio), a breakpoint reflow, and a hidden confusable panel
// becoming visible (display: none → block is itself a resize, from no box
// to a real one) — see the confusable-dropdown wiring in birds.ts, which
// relies on this and calls nothing extra on switch.
export function wireLeaderLines(root: ParentNode): void {
  for (const card of root.querySelectorAll<HTMLElement>(".annotated-photo")) {
    wireCard(card);
  }
}

function wireCard(card: HTMLElement): void {
  const svg = card.querySelector<SVGSVGElement>(".annotation-lines");
  if (!svg) return;
  const observer = new ResizeObserver(() => layout(card, svg));
  observer.observe(card);
}

function layout(card: HTMLElement, svg: SVGSVGElement): void {
  const cardRect = card.getBoundingClientRect();
  if (cardRect.width === 0 || cardRect.height === 0) return;
  svg.setAttribute("viewBox", `0 0 ${cardRect.width} ${cardRect.height}`);

  for (const circle of card.querySelectorAll<HTMLElement>(".annotation-circle")) {
    const index = circle.dataset.annotationIndex;
    const label = card.querySelector<HTMLElement>(
      `.annotation-label[data-annotation-index="${index}"]`,
    );
    const lines = svg.querySelectorAll<SVGLineElement>(`line[data-annotation-index="${index}"]`);
    if (!label || lines.length === 0) continue;

    const c = circle.getBoundingClientRect();
    const l = label.getBoundingClientRect();
    const x1 = String(c.left + c.width / 2 - cardRect.left);
    const y1 = String(c.top + c.height / 2 - cardRect.top);
    const x2 = String(l.left - cardRect.left);
    const y2 = String(l.top + l.height / 2 - cardRect.top);
    for (const line of lines) {
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
    }
  }

  svg.classList.add("lines-ready");
}
