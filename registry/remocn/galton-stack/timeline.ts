import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The pegs and the axis fading in, the balls pouring through the pegs into
// their bins, and the finale once the last ball lands: the pegs fading out,
// the camera moving in, the marker line rising, the tail tinting bin by bin
// and the label landing. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.
//
// How long a ball falls into its bin depends on the frame's shape, so the
// finale here is placed for a 16:9 frame; the component moves it by the
// difference for the frame it renders in.

export type GaltonStackElementId =
  | "drift"
  | "field"
  | "axis"
  | "pour"
  | "field-out"
  | "camera"
  | "line"
  | "tint"
  | "tick"
  | "hero"
  | "sub";

export interface GaltonStackTimingProps {
  count?: number;
  pourLength?: number;
}

export const ROWS = 14;
export const BINS = ROWS + 1;
export const COLS = 4;
const SPAWN0 = 10;
export const SPAWN_WIN = 50;
export const DROP = 6;
export const ROW_T = 1.3;
/** The frame the finale is placed for. */
const REF_W = 1280;
const REF_H = 720;

function hash(a: number, b: number) {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function choose(n: number, k: number) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

export interface Drop {
  bin: number;
  slot: number;
  path: number[];
  spawn: number;
}

/** How many balls fall, 20 to 600. */
export function ballCount(count: number) {
  return Math.max(20, Math.min(600, Math.round(count)));
}

export function buildDrops(count: number, pourLength: number): Drop[] {
  const denom = 2 ** ROWS;
  const target = Array.from({ length: BINS }, (_, b) =>
    Math.round((count * choose(ROWS, b)) / denom),
  );
  const diff = count - target.reduce((s, x) => s + x, 0);
  target[ROWS / 2] += diff;
  const bins: number[] = [];
  target.forEach((n, b) => {
    for (let i = 0; i < n; i++) bins.push(b);
  });
  for (let i = bins.length - 1; i > 0; i--) {
    const j = Math.floor(hash(i, 7) * (i + 1));
    [bins[i], bins[j]] = [bins[j], bins[i]];
  }
  const filled = new Array(BINS).fill(0);
  return bins.map((bin, i) => {
    const moves = Array.from({ length: ROWS }, (_, r): number =>
      r < bin ? 1 : 0,
    );
    for (let r = moves.length - 1; r > 0; r--) {
      const j = Math.floor(hash(i * 31 + r, 13) * (r + 1));
      [moves[r], moves[j]] = [moves[j], moves[r]];
    }
    const path = [0];
    for (const m of moves) path.push(path[path.length - 1] + (m ? 0.5 : -0.5));
    return {
      bin,
      slot: filled[bin]++,
      path,
      spawn: SPAWN0 + (i * pourLength) / Math.max(1, bins.length - 1),
    };
  });
}

/** The frame the last ball lands in its bin, in a frame this size. */
function landEndOf(drops: Drop[], width: number, height: number) {
  const u = Math.min(width / 1280, height / 720);
  const d = 11 * u;
  const row0 = height * 0.17;
  const rowGap = 17 * u;
  const baseY = height * 0.84;
  const exitY = row0 + ROWS * rowGap;
  const slotY = (dr: Drop) =>
    baseY - (Math.floor(dr.slot / COLS) + 0.5) * d - 1 * u;
  const fallDur = (y: number) =>
    5 + Math.sqrt(Math.max(0, y - exitY) / u) * 0.5;
  const flight = (dr: Drop) => DROP + ROWS * ROW_T + fallDur(slotY(dr));
  return Math.max(...drops.map((dr) => dr.spawn + flight(dr)));
}

/**
 * How much later the last ball lands in a frame this size than in the frame
 * the finale is placed for: 0 at 1280×720.
 */
export function finaleShift(drops: Drop[], width: number, height: number) {
  return landEndOf(drops, width, height) - landEndOf(drops, REF_W, REF_H);
}

// `pour` releases the balls evenly over its length; each then falls on its
// own. The finale elements follow `pour` and are timed from the moment the
// last ball lands: `tint` colours the bins one every `step` frames, each
// over `fade`.
export const galtonStackTimeline = defineTimeline<
  GaltonStackElementId,
  GaltonStackTimingProps
>(({ count = 260, pourLength = SPAWN_WIN }) => {
  const drops = buildDrops(ballCount(count), pourLength);
  const MARK = landEndOf(drops, REF_W, REF_H) + 2;
  const finale = (
    id: GaltonStackElementId,
    lane: string,
    label: string,
    from: number,
    to: number,
  ): TimelineElement<GaltonStackElementId> => ({
    id,
    lane,
    label,
    start: MARK + from,
    length: to - from,
    follows: "pour",
  });
  const elements: TimelineElement<GaltonStackElementId>[] = [
    { id: "drift", lane: "Colour", label: "Drift", start: 0, length: 180 },
    { id: "field", lane: "Board", label: "Pegs", start: 0, length: 14 },
    { id: "axis", lane: "Axis", label: "Axis", start: 2, length: 20 },
    {
      id: "pour",
      lane: "Balls",
      label: "Pour",
      start: SPAWN0,
      length: pourLength,
    },
    finale("field-out", "Board", "Pegs out", -8, 8),
    finale("camera", "Camera", "Camera", -6, 26),
    finale("line", "Marker", "Line", 2, 20),
    {
      ...finale("tint", "Balls", "Tint", 6, 11 + ROWS * 1.8),
      beats: { step: 1.8, fade: 5 },
    },
    finale("tick", "Marker", "Tick", 10, 24),
    finale("hero", "Label", "Figure", 14, 34),
    finale("sub", "Label", "Caption", 22, 40),
  ];
  return elements;
});
