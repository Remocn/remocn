import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each tube of the sign stutters on in turn, then the whole sign buzzes out
// once and its glow settles. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type NeonSignElementId = `tube:${number}` | "buzz";

export interface NeonSignTimingProps {
  path?: string;
  seed?: number;
}

// Handwritten "hello" with an underline swash, one subpath per tube.
export const HELLO = [
  "M 30 132 C 52 112 74 70 70 46 C 67 28 50 30 47 52 C 44 76 42 112 40 140 C 46 116 58 100 72 100 C 86 100 84 122 86 134 C 88 144 100 144 110 132",
  "M 110 132 C 124 124 142 110 136 98 C 130 88 112 96 112 116 C 112 138 134 146 156 130",
  "M 156 130 C 176 110 196 66 190 46 C 186 32 170 36 168 60 C 166 90 168 126 172 136 C 176 146 188 142 196 132",
  "M 196 132 C 216 110 232 66 226 46 C 222 32 206 36 204 60 C 202 90 204 126 208 136 C 212 146 224 142 232 132",
  "M 232 132 C 238 116 248 100 262 100 C 278 100 280 124 268 136 C 256 146 242 136 248 118 C 252 106 268 104 290 104",
  "M 52 170 C 120 160 210 162 296 152",
].join(" ");
export const DEFAULT_SEED = 7;

const FIRST = 3;
const STEP = 3.4;
const STUTTER = 7;
/** The sign drops out to these levels, one frame each, from `BUZZ_AT`. */
export const BUZZ_LEVELS = [0.1, 0, 0.55, 0.2];
const BUZZ_AT = 29;
const SETTLE_AT = 32;
const SETTLE_END = 40;

// Remotion's `random()` for a string seed, so each tube's onset stays
// exactly as it was.
function mulberry32(a: number) {
  let t = a + 1831565813;
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

/** Subpaths in an SVG path: one per `M` or `m` command. */
const tubesIn = (path: string) => (path.match(/[Mm]/g) ?? []).length;

// A tube's element is its stutter; once it ends the tube is lit. The buzz
// drops the sign to `BUZZ_LEVELS`, one `pulse` each, and the glow settles
// from `settle` to `settleEnd`.
export const neonSignTimeline = defineTimeline<
  NeonSignElementId,
  NeonSignTimingProps
>(({ path = HELLO, seed = DEFAULT_SEED }) => {
  const elements: TimelineElement<NeonSignElementId>[] = Array.from(
    { length: tubesIn(path) },
    (_, i) => ({
      id: `tube:${i}` as const,
      lane: "Tubes",
      label: `Tube ${i + 1}`,
      start: FIRST + i * STEP + seeded(`neon-sign-${seed}-${i}`) * 2,
      length: STUTTER,
      follows: i > 0 ? (`tube:${i - 1}` as const) : undefined,
    }),
  );
  elements.push({
    id: "buzz",
    lane: "Buzz",
    label: "Sign buzzes",
    start: BUZZ_AT,
    length: SETTLE_END - BUZZ_AT,
    beats: {
      pulse: 1,
      settle: SETTLE_AT - BUZZ_AT,
      settleEnd: SETTLE_END - BUZZ_AT,
    },
  });
  return elements.sort((a, b) => a.start - b.start);
});
