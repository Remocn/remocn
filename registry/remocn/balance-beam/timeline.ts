import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The beam and fulcrum rising in, the stack's blocks dropping onto the left
// arm one after another, the accent block landing on the right and tipping
// the beam, then the camera easing down to the headline and the subtitle.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type BalanceBeamElementId =
  | "enter"
  | `block:${number}`
  | "accent"
  | "camera"
  | "title"
  | "subtitle";

export interface BalanceBeamTimingProps {
  items?: string[];
  stagger?: number;
}

export const DEFAULT_ITEMS = [
  "$4,800",
  "62 hours",
  "3 tools",
  "9 revisions",
  "2 freelancers",
];

const START = 12;
const STEP = 9;
const FALL = 14;
const ACCENT_GAP = 16;
const ACCENT_FALL = 18;
const HERO_GAP = 22;

// `enter` raises the beam, fulcrum and level line. `block:<k>` drops the
// `k`-th block of the stack (widest first) and lands at its end; a chain.
// `accent` drops the accent block after the last one and tips the beam at
// its end. `camera` eases the scene down to the headline, `title` and
// `subtitle` rise in after it.
export const balanceBeamTimeline = defineTimeline<
  BalanceBeamElementId,
  BalanceBeamTimingProps
>(({ items = DEFAULT_ITEMS, stagger = STEP }) => {
  // The stack drops widest first; widths at a frame scale of 1 sort the same
  // as the component's at any scale.
  const sized = items
    .slice(0, 8)
    .map((label) => ({ label, w: Math.max(76, label.length * 0.52 * 18 + 36) }))
    .sort((a, b) => b.w - a.w);
  const elements: TimelineElement<BalanceBeamElementId>[] = [
    { id: "enter", lane: "Beam", label: "Enter", start: 0, length: 14 },
  ];
  let last = START;
  sized.forEach((b, k) => {
    const spawn = START + k * stagger;
    elements.push({
      id: `block:${k}`,
      lane: "Blocks",
      label: b.label,
      start: spawn,
      length: FALL,
      follows: k > 0 ? `block:${k - 1}` : undefined,
    });
    last = spawn + FALL;
  });
  const aSpawn = last + ACCENT_GAP;
  const aLand = aSpawn + ACCENT_FALL;
  const heroAt = aLand + HERO_GAP;
  elements.push(
    {
      id: "accent",
      lane: "Blocks",
      label: "Accent",
      start: aSpawn,
      length: ACCENT_FALL,
      follows: sized.length > 0 ? `block:${sized.length - 1}` : undefined,
    },
    {
      id: "camera",
      lane: "Camera",
      label: "Camera",
      start: heroAt - 8,
      length: 30,
      follows: "accent",
    },
    {
      id: "title",
      lane: "Copy",
      label: "Title",
      start: heroAt + 2,
      length: 20,
      follows: "camera",
    },
    {
      id: "subtitle",
      lane: "Copy",
      label: "Subtitle",
      start: heroAt + 10,
      length: 18,
      follows: "title",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
