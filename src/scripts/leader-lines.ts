// Draws the straight line connecting each annotation circle on a feature
// card's photo to its label, and positions that label in the first place.
// Every label is a plain sibling of .annotated-photo-frame (see
// FeatureCard.astro) rather than living in one shared legend column: with
// enough annotations (the 5-feature Daurian Redstart card, the highest
// count in the data) a single stacked column reads as cramped and its
// converging lines cross each other. Instead each label is assigned to one
// of two sides — left/right of the photo on desktop, top/bottom on mobile —
// and evenly spaced along that side, which keeps labels from overlapping no
// matter how many a card has, at the cost of a label's position only
// tracking its marker's rank within its side, not its exact cross-axis
// coordinate.
//
// All of this depends on real rendered geometry (the frame's box, in
// particular), so it's computed here at runtime rather than hand-authored
// as CSS/build-time percentages — the same reason the line coordinates
// themselves have always been computed here.
//
// A ResizeObserver per card (not a window resize listener + image load
// listener) covers every case that needs a re-layout with one primitive:
// the image finishing loading (its box grows from nothing to its natural
// aspect ratio), a breakpoint reflow, and a hidden confusable panel
// becoming visible (display: none → block is itself a resize, from no box
// to a real one) — see the confusable-dropdown wiring in birds.ts, which
// relies on this and calls nothing extra on switch. The desktop/mobile
// side-assignment split itself is driven by the same `width <= 30rem`
// breakpoint .annotated-photo already flips on in CSS, so a breakpoint
// crossing that happens to leave the card's own box size unchanged (rare,
// but possible mid-transition) is caught by a dedicated matchMedia
// listener re-running every wired card's layout.
const MOBILE_QUERY = "(width <= 30rem)";
const GAP_PX = 12;

type Side = "start" | "end";

interface WiredCard {
  card: HTMLElement;
  frame: HTMLElement;
  svg: SVGSVGElement;
}

const wiredCards: WiredCard[] = [];
let mediaListenerAttached = false;

export function wireLeaderLines(root: ParentNode): void {
  for (const card of root.querySelectorAll<HTMLElement>(".annotated-photo")) {
    wireCard(card);
  }

  if (!mediaListenerAttached) {
    mediaListenerAttached = true;
    window.matchMedia(MOBILE_QUERY).addEventListener("change", () => {
      for (const { card, frame, svg } of wiredCards) layout(card, frame, svg);
    });
  }
}

function wireCard(card: HTMLElement): void {
  const frame = card.querySelector<HTMLElement>(".annotated-photo-frame");
  const svg = card.querySelector<SVGSVGElement>(".annotation-lines");
  if (!frame || !svg) return;
  wiredCards.push({ card, frame, svg });
  const observer = new ResizeObserver(() => layout(card, frame, svg));
  observer.observe(card);
}

function layout(card: HTMLElement, frame: HTMLElement, svg: SVGSVGElement): void {
  const cardRect = card.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  if (cardRect.width === 0 || cardRect.height === 0) return;
  svg.setAttribute("viewBox", `0 0 ${cardRect.width} ${cardRect.height}`);

  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  const circles = Array.from(card.querySelectorAll<HTMLElement>(".annotation-circle"));
  const sideByIndex = new Map<string, Side>();
  const groups: Record<Side, HTMLElement[]> = { start: [], end: [] };

  for (const circle of circles) {
    // The stored per-mille position each circle was placed at (rounds.ts's
    // x/y, read back off the inline style Astro already set) — desktop
    // splits by x (left half vs right half of the photo), mobile splits by
    // y (top half vs bottom half) instead, since a phone's photo is tall
    // and narrow rather than wide.
    const xPct = parseFloat(circle.style.left);
    const yPct = parseFloat(circle.style.top);
    const side: Side = mobile ? (yPct < 50 ? "start" : "end") : (xPct < 50 ? "start" : "end");
    groups[side].push(circle);
    const index = circle.dataset.annotationIndex;
    if (index !== undefined) sideByIndex.set(index, side);
  }

  for (const side of ["start", "end"] as const) {
    const group = groups[side]
      .slice()
      .sort((a, b) => crossAxisPosition(a, mobile) - crossAxisPosition(b, mobile));
    const n = group.length;
    group.forEach((circle, i) => {
      const label = findLabel(card, circle);
      if (!label) return;
      const t = n === 1 ? 0.5 : i / (n - 1);
      placeLabel(label, side, mobile, t, cardRect, frameRect);
    });
  }

  for (const circle of circles) {
    const index = circle.dataset.annotationIndex;
    const label = findLabel(card, circle);
    const lines = svg.querySelectorAll<SVGLineElement>(`line[data-annotation-index="${index}"]`);
    if (!label || lines.length === 0) continue;
    const side = sideByIndex.get(index ?? "") ?? "end";

    const c = circle.getBoundingClientRect();
    const l = label.getBoundingClientRect();
    const x1 = String(c.left + c.width / 2 - cardRect.left);
    const y1 = String(c.top + c.height / 2 - cardRect.top);
    const [x2, y2] = labelAnchor(l, side, mobile, cardRect);
    for (const line of lines) {
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
    }
  }

  svg.classList.add("lines-ready");
}

function crossAxisPosition(circle: HTMLElement, mobile: boolean): number {
  return parseFloat(mobile ? circle.style.left : circle.style.top);
}

function findLabel(card: HTMLElement, circle: HTMLElement): HTMLElement | null {
  const index = circle.dataset.annotationIndex;
  return card.querySelector<HTMLElement>(`.annotation-label[data-annotation-index="${index}"]`);
}

// Sets each label's position as inline left/right/top/bottom + a centering
// transform, computed from the frame's real rect — the frame is the only
// other element .annotated-photo (this label's positioned ancestor) holds,
// so every value here is relative to that shared container.
function placeLabel(
  label: HTMLElement,
  side: Side,
  mobile: boolean,
  t: number,
  cardRect: DOMRect,
  frameRect: DOMRect,
): void {
  label.classList.toggle("annotation-label-start", side === "start");
  label.classList.toggle("annotation-label-end", side === "end");
  label.style.left = "auto";
  label.style.right = "auto";
  label.style.top = "auto";
  label.style.bottom = "auto";

  if (!mobile) {
    const top = frameRect.top - cardRect.top + t * frameRect.height;
    label.style.top = `${top}px`;
    label.style.transform = "translateY(-50%)";
    if (side === "start") {
      label.style.right = `${cardRect.right - frameRect.left + GAP_PX}px`;
    } else {
      label.style.left = `${frameRect.right - cardRect.left + GAP_PX}px`;
    }
  } else {
    const left = frameRect.left - cardRect.left + t * frameRect.width;
    label.style.left = `${left}px`;
    label.style.transform = "translateX(-50%)";
    if (side === "start") {
      label.style.bottom = `${cardRect.bottom - frameRect.top + GAP_PX}px`;
    } else {
      label.style.top = `${frameRect.bottom - cardRect.top + GAP_PX}px`;
    }
  }
}

// Which edge of the label a leader line should reach — whichever edge
// faces the photo, so the line stops at the label's boundary instead of
// crossing into (or stopping short of) its text.
function labelAnchor(l: DOMRect, side: Side, mobile: boolean, cardRect: DOMRect): [number, number] {
  if (!mobile) {
    const y = l.top + l.height / 2 - cardRect.top;
    const x = side === "start" ? l.right - cardRect.left : l.left - cardRect.left;
    return [x, y];
  }
  const x = l.left + l.width / 2 - cardRect.left;
  const y = side === "start" ? l.bottom - cardRect.top : l.top - cardRect.top;
  return [x, y];
}
