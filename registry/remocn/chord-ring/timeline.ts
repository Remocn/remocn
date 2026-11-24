import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The ring's names drawing in segment by segment, the chords between them
// threading across, the brand's chords lighting up in the accent and the
// caption landing in the core. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type ChordRingElementId =
  | "camera"
  | `segment:${number}`
  | `chord:${number}`
  | "brand"
  | "caption";

export interface ChordRingTimingProps {
  segments?: string[];
  brandIndex?: number;
  /** Frames between chords as they draw. */
  stagger?: number;
}

export const DEFAULT_SEGMENTS = [
  "remocn",
  "Kitebase",
  "Lumen",
  "Fernway",
  "Quarry",
  "Orbitly",
  "Halcyon",
  "Tessel",
  "Northwind",
];

const SEG_START = 2;
const SEG_STAGGER = 2;
const SEG_LEN = 12;
export const CHORD_STAGGER = 2.2;
const CHORD_START = 26;
const CHORD_LEN = 16;

/** The ring's names, at most twelve, and the clamped brand segment. */
export function ringOf(segments: string[], brandIndex: number) {
  const list = segments.slice(0, 12);
  const n = list.length;
  const brand = Math.min(Math.max(0, Math.round(brandIndex)), n - 1);
  return { list, n, brand };
}

/** The chords in drawing order: every brand pair, woven with a few others. */
export function buildPairs(n: number, brand: number) {
  const brandPairs: [number, number][] = [];
  for (let i = 0; i < n; i++) if (i !== brand) brandPairs.push([brand, i]);
  const seen = new Set<string>();
  const others: [number, number][] = [];
  for (const k of [3, Math.floor(n / 2)]) {
    for (let i = 0; i < n; i++) {
      const j = (i + k) % n;
      if (i === brand || j === brand || i === j) continue;
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      others.push([i, j]);
    }
  }
  const order: { a: number; b: number; brand: boolean }[] = [];
  const len = Math.max(brandPairs.length, others.length);
  for (let i = 0; i < len; i++) {
    const o = others[(i * 5) % Math.max(1, others.length)];
    if (i < others.length && o) order.push({ a: o[0], b: o[1], brand: false });
    const bp = brandPairs[(i * 3) % Math.max(1, brandPairs.length)];
    if (i < brandPairs.length && bp)
      order.push({ a: bp[0], b: bp[1], brand: true });
  }
  const uniq = new Set<string>();
  return order.filter((c) => {
    const key = `${Math.min(c.a, c.b)}-${Math.max(c.a, c.b)}`;
    if (uniq.has(key)) return false;
    uniq.add(key);
    return true;
  });
}

// `camera` is the stage fading in (`fade`), the ring's turn into place
// (`spin`) and the slow push over its whole length. `segment:<i>` draws arc
// `i`; its name slides out from `label` over `labelLen`. `chord:<k>` is the
// k-th chord in drawing order. Both lists are chains. `brand` starts on the
// hit, six frames after the last chord: the brand's chords flip to the
// accent, the rest dim over `dim`, the core disc fades in over `disc` and
// its mesh drifts over `drift`. `caption` lands in the core.
export const chordRingTimeline = defineTimeline<
  ChordRingElementId,
  ChordRingTimingProps
>(
  ({
    segments = DEFAULT_SEGMENTS,
    brandIndex = 0,
    stagger = CHORD_STAGGER,
  }) => {
    const { list, n, brand } = ringOf(segments, brandIndex);
    const pairs = buildPairs(n, brand);

    const elements: TimelineElement<ChordRingElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "push in",
        start: 0,
        length: 160,
        beats: { fade: 8, spin: 90 },
      },
    ];
    list.forEach((label, i) => {
      elements.push({
        id: `segment:${i}`,
        lane: "Segments",
        label,
        start: SEG_START + i * SEG_STAGGER,
        length: SEG_LEN,
        follows: i > 0 ? `segment:${i - 1}` : undefined,
        beats: { label: SEG_LEN - 6, labelLen: 16 },
      });
    });
    let lastChord = CHORD_START + 10;
    pairs.forEach((c, ci) => {
      const start = CHORD_START + ci * stagger;
      lastChord = start + CHORD_LEN;
      elements.push({
        id: `chord:${ci}`,
        lane: "Chords",
        label: `${list[c.a]} – ${list[c.b]}`,
        start,
        length: CHORD_LEN,
        follows: ci > 0 ? `chord:${ci - 1}` : undefined,
      });
    });
    const hit = Math.round(lastChord + 6);
    elements.push(
      {
        id: "brand",
        lane: "Finale",
        label: "brand lights up",
        start: hit,
        length: 18,
        follows: pairs.length ? `chord:${pairs.length - 1}` : undefined,
        beats: { dim: 18, disc: 10, drift: 90 },
      },
      {
        id: "caption",
        lane: "Caption",
        label: "caption",
        start: hit + 8,
        length: 16,
        follows: "brand",
        beats: { fade: 10, blur: 16 },
      },
    );
    return elements;
  },
);
