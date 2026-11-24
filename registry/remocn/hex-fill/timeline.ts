import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The grid's rings of outlines appearing from the center out, the figure
// and the label rising, the cells filling in a sweep around the center, and
// the grid settling once they are in. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type HexFillElementId =
  | `ring:${number}`
  | "figure"
  | "label"
  | "fill"
  | "done";

export interface HexFillTimingProps {
  value?: number;
  rings?: number;
  /** Frames the cells take to fill. */
  fillLength?: number;
}

const FILL0 = 14;
export const FILL_LEN = 70;
const RING_LAG = 1.2;

/** Rings of cells around the center one, clamped to what the grid draws. */
export function ringCount(rings: number) {
  return Math.max(3, Math.min(10, Math.round(rings)));
}

export interface HexCell {
  q: number;
  r: number;
  x: number;
  y: number;
  ring: number;
  ang: number;
}

export function buildCells(rings: number): HexCell[] {
  const out: HexCell[] = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      const s = -q - r;
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (ring > rings) continue;
      const x = Math.sqrt(3) * (q + r / 2);
      const y = 1.5 * r;
      let ang = ring === 0 ? -1 : Math.atan2(x, -y);
      if (ring > 0 && ang < -1e-6) ang += Math.PI * 2;
      out.push({ q, r, x, y, ring, ang: ring === 0 ? 0 : ang / (Math.PI * 2) });
    }
  }
  out.sort((a, b) => a.ang - b.ang || a.ring - b.ring);
  return out;
}

const NB = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

export function pickFill(cells: HexCell[], F: number) {
  const index = new Map<string, number>();
  cells.forEach((c, i) => {
    index.set(`${c.q},${c.r}`, i);
  });
  const nbs = cells.map((c) =>
    NB.map(([dq, dr]) => index.get(`${c.q + dq},${c.r + dr}`)).filter(
      (v): v is number => v !== undefined,
    ),
  );
  const on = cells.map((_, i) => i < F);
  const score = (i: number) =>
    nbs[i].reduce((sum, j) => sum + (on[j] ? 1 : 0), 0) / nbs[i].length;
  for (let it = 0; it < 40; it++) {
    let worst = -1;
    let best = -1;
    for (let i = 1; i < cells.length; i++) {
      if (on[i] && (worst < 0 || score(i) < score(worst))) worst = i;
      if (!on[i] && (best < 0 || score(i) > score(best))) best = i;
    }
    if (worst < 0 || best < 0 || score(best) - score(worst) < 0.34) break;
    on[worst] = false;
    on[best] = true;
  }
  const chosen = cells.filter((_, i) => on[i]);
  const rest = cells.filter((_, i) => !on[i]);
  return [...chosen, ...rest];
}

/** The cells in fill order and how many of them fill for `value` percent. */
export function hexCells(rings: number, value: number) {
  const all = buildCells(ringCount(rings));
  const pct = Math.max(0, Math.min(100, value));
  const F = Math.round((pct / 100) * all.length);
  return { cells: pickFill(all, F), F };
}

// `ring:<r>` is ring `r` of outlines appearing; the rings chain outward.
// `figure` and `label` rise in. `fill` is the sweep of filling cells: a
// cell fills at its angle along a `sweep`-frame sweep, `lag` frames later
// per ring out, its outline fading over `fade`; the camera push runs
// `cameraTail` past it. `done` dims the empty cells and follows `fill`.
export const hexFillTimeline = defineTimeline<
  HexFillElementId,
  HexFillTimingProps
>(({ value = 86, rings = 7, fillLength = FILL_LEN }) => {
  const N = ringCount(rings);
  const { cells, F } = hexCells(rings, value);
  const angMax = F > 0 ? cells[F - 1].ang : 1;
  const fillAt = (i: number) => {
    const k = Math.min(1, cells[i].ang / Math.max(1e-3, angMax));
    return (
      FILL0 +
      (fillLength * Math.acos(1 - 2 * k)) / Math.PI +
      cells[i].ring * RING_LAG
    );
  };
  let fillEnd = FILL0;
  for (let i = 0; i < F; i++) fillEnd = Math.max(fillEnd, fillAt(i));
  const out: TimelineElement<HexFillElementId>[] = [];
  for (let r = 0; r <= N; r++) {
    out.push({
      id: `ring:${r}`,
      lane: "Grid",
      label: `ring ${r}`,
      start: r * 1.4,
      length: 10,
      follows: r > 0 ? `ring:${r - 1}` : undefined,
    });
  }
  out.push(
    { id: "figure", lane: "Copy", label: "figure", start: 4, length: 18 },
    { id: "label", lane: "Copy", label: "label", start: 10, length: 18 },
    {
      id: "fill",
      lane: "Fill",
      label: "fill",
      start: FILL0,
      // Written so that `start + length` is the last cell's fill frame.
      length: fillEnd - FILL0,
      beats: { sweep: fillLength, lag: RING_LAG, fade: 4, cameraTail: 40 },
    },
    {
      id: "done",
      lane: "Fill",
      label: "settle",
      start: fillEnd + 2,
      length: 16,
      follows: "fill",
    },
  );
  return out.sort((a, b) => a.start - b.start);
});
