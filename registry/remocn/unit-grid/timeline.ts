import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The grid's units appearing in a diagonal wave, the count rising, the
// highlighted units flipping over to the lit side, the caption landing and
// the grid settling. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type UnitGridElementId =
  | "appear"
  | "count"
  | "flip"
  | "caption"
  | "settle";

export interface UnitGridTimingProps {
  total?: number;
  highlighted?: number;
  /** Frames each highlighted unit takes to flip. */
  flip?: number;
}

export const APPEAR_STEP = 0.9;
const APPEAR_DUR = 12;
/** Frames the appear wave runs ahead of the scene's first frame. */
const APPEAR_LEAD = 4;
export const FLIP_START = 34;
export const FLIP_DUR = 10;

/** Frames the flips spread over, first unit to last. */
export function flipSpan(n: number) {
  return Math.min(60, Math.max(10, 8 + n * 0.9));
}

export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function gridShape(total: number) {
  if (total === 100) return { cols: 10, rows: 10 };
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  return { cols, rows: Math.ceil(total / cols) };
}

/** Frame (before the lead) unit `i` of a grid `cols` wide starts appearing. */
export function appearOf(i: number, cols: number) {
  const c = i % cols;
  const row = Math.floor(i / cols);
  return (c + row) * APPEAR_STEP + hash(i + 1.3) * 2;
}

// `appear` is the grid's units fading in, each over `unit` frames, in a
// diagonal wave running `lead` frames ahead. `count` is the count rising.
// `flip` is the highlighted units flipping, spread over `span` with each
// unit turning over `unit`; the glow keeps growing `glowTail` frames after
// it and the camera push runs `cameraTail` past it. `caption` lands around
// the last flip and `settle` dims the rest of the grid; both follow `flip`.
export const unitGridTimeline = defineTimeline<
  UnitGridElementId,
  UnitGridTimingProps
>(({ total = 100, highlighted = 33, flip = FLIP_DUR }) => {
  const n = Math.max(1, Math.round(total));
  const hi = Math.max(0, Math.min(n, Math.round(highlighted)));
  const { cols } = gridShape(n);
  let lastAppear = 0;
  for (let i = 0; i < n; i++)
    lastAppear = Math.max(lastAppear, appearOf(i, cols));
  const span = flipSpan(hi);
  const flipEnd = FLIP_START + span + flip;
  const out: TimelineElement<UnitGridElementId>[] = [
    {
      id: "appear",
      lane: "Grid",
      label: "appear",
      start: 0,
      length: Math.max(0, lastAppear - APPEAR_LEAD + APPEAR_DUR),
      beats: { lead: APPEAR_LEAD, unit: APPEAR_DUR },
    },
    { id: "count", lane: "Copy", label: "count", start: 16, length: 18 },
    {
      id: "flip",
      lane: "Grid",
      label: "flip",
      start: FLIP_START,
      // Written so that `start + length` is `flipEnd` to the last bit.
      length: flipEnd - FLIP_START,
      beats: { span, unit: flip, glowTail: 10, cameraTail: 40 },
    },
    {
      id: "caption",
      lane: "Copy",
      label: "caption",
      start: flipEnd - 8,
      length: 20,
      follows: "flip",
    },
    {
      id: "settle",
      lane: "Grid",
      label: "settle",
      start: flipEnd,
      length: 22,
      follows: "flip",
    },
  ];
  return out;
});
