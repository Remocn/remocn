import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each shape tumbling into the poster, landing one beat after the last, and
// each shape tumbling one step out of its slot for the rebuild. Frames on the
// 30 fps scene timeline, after `speed`; with `loop` the scene plays this
// schedule forward and then back. The ids are public: a saved `timing` prop
// refers to them.

export type BauhausBuildElementId = `enter:${string}` | `rebuild:${string}`;

export interface BauhausBuildTimingProps {
  seed?: number;
}

export type BauhausShape =
  | "circle"
  | "square"
  | "semicircle"
  | "quarter"
  | "bar";

export type BauhausRole = "ink" | "accent" | "secondary" | "tertiary";

export type TumbleDirection = "U" | "D" | "L" | "R";

export type TumbleMove = `${TumbleDirection}${"+" | "-"}`;

export interface BauhausPose {
  turn: number;
  x: number;
  y: number;
}

export interface BauhausPiece {
  id: string;
  shape: BauhausShape;
  width: number;
  height: number;
  role: BauhausRole;
  slot: BauhausPose;
  enter: readonly TumbleMove[];
  rebuild: readonly TumbleMove[];
  cue: number;
  after: readonly string[];
}

export const BAUHAUS_PIECES: readonly BauhausPiece[] = [
  {
    id: "hill",
    shape: "quarter",
    width: 4,
    height: 4,
    role: "ink",
    slot: { turn: 3, x: 0, y: 4 },
    enter: ["D-", "R+"],
    rebuild: ["D-"],
    cue: 0,
    after: ["tile"],
  },
  {
    id: "tile",
    shape: "square",
    width: 1,
    height: 1,
    role: "accent",
    slot: { turn: 0, x: 4, y: 7 },
    enter: ["U+", "U+", "U+", "U+"],
    rebuild: ["D+"],
    cue: 3,
    after: ["pillar"],
  },
  {
    id: "pillar",
    shape: "bar",
    width: 4,
    height: 1,
    role: "ink",
    slot: { turn: 1, x: 5, y: 4 },
    enter: ["R+", "R+"],
    rebuild: ["U+"],
    cue: 6,
    after: ["sun"],
  },
  {
    id: "sun",
    shape: "circle",
    width: 4,
    height: 4,
    role: "accent",
    slot: { turn: 0, x: 6, y: 4 },
    enter: ["U+", "U+"],
    rebuild: ["U-"],
    cue: 9,
    after: [],
  },
  {
    id: "dome",
    shape: "semicircle",
    width: 2,
    height: 2,
    role: "secondary",
    slot: { turn: 3, x: 1, y: 1 },
    enter: ["R+", "D-"],
    rebuild: ["R+"],
    cue: 12,
    after: ["pillar"],
  },
  {
    id: "post",
    shape: "bar",
    width: 4,
    height: 1,
    role: "tertiary",
    slot: { turn: 1, x: 11, y: 4 },
    enter: ["D+", "D+"],
    rebuild: ["D-"],
    cue: 15,
    after: [],
  },
  {
    id: "dot",
    shape: "circle",
    width: 1,
    height: 1,
    role: "ink",
    slot: { turn: 0, x: 11, y: 3 },
    enter: ["D-", "D-", "D-", "D-"],
    rebuild: ["L-"],
    cue: 18,
    after: ["post"],
  },
  {
    id: "block",
    shape: "square",
    width: 2,
    height: 2,
    role: "tertiary",
    slot: { turn: 0, x: 6, y: 10 },
    enter: ["U+", "U+", "U+"],
    rebuild: ["L+"],
    cue: 21,
    after: ["sun"],
  },
  {
    id: "fan",
    shape: "quarter",
    width: 2,
    height: 2,
    role: "secondary",
    slot: { turn: 2, x: 8, y: 10 },
    enter: ["L-", "L+", "L+"],
    rebuild: ["R+"],
    cue: 24,
    after: ["block"],
  },
];

export const BAUHAUS_LEAD = 22;
export const BAUHAUS_BEAT = 6;
export const BAUHAUS_REBUILD = 90;
const TURN = 5;
const SETTLE = 0.5;

function seedKey(seed: number) {
  return Number.isFinite(seed) ? Math.round(seed) : 1;
}

// Remotion's `random()` for a string seed, so the build order stays exactly
// as it was.
function mulberry32(a: number) {
  let t = a + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function seeded(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return mulberry32(hash);
}

export function tumbleDurationOf(
  piece: Pick<BauhausPiece, "width" | "height">,
) {
  return TURN * Math.sqrt(Math.max(piece.width, piece.height));
}

export function bauhausOrderOf(seed = 1) {
  const key = seedKey(seed);
  const rank = (piece: BauhausPiece) =>
    seeded(`bauhaus-build-${key}-order-${piece.id}`);
  const placed: BauhausPiece[] = [];
  const waiting = [...BAUHAUS_PIECES];
  while (waiting.length > 0) {
    const ready = waiting.filter((piece) =>
      piece.after.every((id) => placed.some((done) => done.id === id)),
    );
    const next = ready.reduce((best, piece) =>
      rank(piece) < rank(best) ? piece : best,
    );
    placed.push(next);
    waiting.splice(waiting.indexOf(next), 1);
  }
  return placed;
}

// `enter:<piece>` tumbles a shape in from off its slot, so that it lands
// `BAUHAUS_BEAT` after the shape before it in the seeded build order; it
// starts hidden and unfolds on its first step. `rebuild:<piece>` tumbles it
// out again on its cue, a chain in cue order. `step` is one quarter turn;
// a landing settles for `SETTLE` of a step past the last one.
export const bauhausTumbleTimeline = defineTimeline<
  BauhausBuildElementId,
  BauhausBuildTimingProps
>(({ seed = 1 }) => {
  const out: TimelineElement<BauhausBuildElementId>[] = [];
  bauhausOrderOf(seed).forEach((piece, arrival) => {
    const duration = tumbleDurationOf(piece);
    const travel = piece.enter.length * duration;
    out.push({
      id: `enter:${piece.id}`,
      lane: "Build",
      label: piece.id,
      start: BAUHAUS_LEAD + arrival * BAUHAUS_BEAT - travel,
      length: travel + duration * SETTLE,
      beats: { step: duration },
    });
  });
  out.sort((a, b) => a.start - b.start);
  BAUHAUS_PIECES.forEach((piece, k) => {
    const duration = tumbleDurationOf(piece);
    out.push({
      id: `rebuild:${piece.id}`,
      lane: "Rebuild",
      label: piece.id,
      start: BAUHAUS_REBUILD + piece.cue,
      length: piece.rebuild.length * duration + duration * SETTLE,
      follows: k > 0 ? `rebuild:${BAUHAUS_PIECES[k - 1].id}` : undefined,
      beats: { step: duration },
    });
  });
  return out;
});
