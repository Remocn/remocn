import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A spark opens a hot seam across the frame and the letters forge out of
// glitching slices, ring by ring from the center, the mark last. The camera
// punches as the mark locks, the metal cools to its colors and the tagline
// rises in word by word, under a slow push across the whole sting. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type NoiseForgeStingElementId =
  | "push"
  | "ground"
  | "seam"
  | `letter:${number}`
  | "mark"
  | "seamOut"
  | "lock"
  | "cool"
  | `word:${number}`;

export interface NoiseForgeStingTimingProps {
  name?: string;
  tagline?: string;
  stagger?: number;
}

const B = {
  spark: 0,
  seam: 4,
  seamLen: 18,
  forge: 12,
  ring: 6,
  glyphLen: 15,
  markLen: 18,
  seamOut: 30,
  seamOutLen: 18,
  lock: 48,
  cool: 54,
  coolLen: 18,
  tagline: 66,
  end: 126,
};

/** Frames of the whole sting. */
export const FORGE_LENGTH = B.end;
export const FORGE_RING = B.ring;
export const DEFAULT_FORGE_NAME = "emocn";
export const DEFAULT_FORGE_TAGLINE = "Launch videos, built from parts.";

export type ForgeGlyph = {
  key: string;
  order: number;
  mark: boolean;
  char: string;
  /** Position in the name; -1 for the mark. */
  index: number;
};

/** The mark, then the name's letters, each with its ring from the center. */
export function forgeGlyphPlan(word: string): ForgeGlyph[] {
  const chars = Array.from(word);
  const n = chars.length;
  const centre = (n - 1) / 2;
  const letters = chars.map((c, i) => ({
    key: `${c}-${i.toString()}`,
    order: Math.floor(Math.abs(i - centre)),
    mark: false,
    char: c,
    index: i,
  }));
  const last = letters.reduce((m, g) => Math.max(m, g.order), 0);
  return [
    { key: "mark", order: last + 1, mark: true, char: "", index: -1 },
    ...letters,
  ];
}

// `push` is the slow camera push across the sting; `ground` fades the
// ground up. `seam` grows the hot seam over its length; the spark lights at
// `spark` (before the start) over `sparkIn`. `letter:<i>` forges letter `i`
// of the name over its length, a ring of `stagger` frames after the letter
// next to it toward the center; `mark` forges the mark one ring after the
// outermost letters. `seamOut` closes the seam. `lock` punches the camera
// in to `peak` and back. `cool` cools the metal to its colors. `word:<i>`
// rises word `i` of the tagline in (a chain).
export const noiseForgeStingTimeline = defineTimeline<
  NoiseForgeStingElementId,
  NoiseForgeStingTimingProps
>(
  ({
    name = DEFAULT_FORGE_NAME,
    tagline = DEFAULT_FORGE_TAGLINE,
    stagger = B.ring,
  }) => {
    const glyphs = forgeGlyphPlan(name);
    const letters = glyphs.filter((g) => !g.mark);
    const centre = (letters.length - 1) / 2;
    const idOf = (g: ForgeGlyph): NoiseForgeStingElementId =>
      g.mark ? "mark" : `letter:${g.index}`;
    const outer = letters.find((g) => g.order === glyphs[0].order - 1);
    const forged = glyphs.map((g) => {
      // A letter follows its neighbour toward the center; the mark follows
      // the outermost letter.
      const inner = g.mark
        ? outer
        : g.order > 0
          ? letters[g.index + (g.index < centre ? 1 : -1)]
          : undefined;
      const element: TimelineElement<NoiseForgeStingElementId> = {
        id: idOf(g),
        lane: g.mark ? "Mark" : "Letters",
        label: g.mark ? "Mark" : g.char,
        start: B.forge + g.order * stagger,
        length: g.mark ? B.markLen : B.glyphLen,
        follows: inner ? idOf(inner) : undefined,
      };
      return { element, order: g.order };
    });
    const elements: TimelineElement<NoiseForgeStingElementId>[] = [
      { id: "push", lane: "Camera", label: "Push", start: 0, length: B.end },
      { id: "ground", lane: "Ground", label: "Fade up", start: 0, length: 18 },
      {
        id: "seam",
        lane: "Seam",
        label: "Seam",
        start: B.seam,
        length: B.seamLen,
        beats: { spark: B.spark - 3 - B.seam, sparkIn: 6 },
      },
      ...forged
        .sort((a, b) => a.element.start - b.element.start || a.order - b.order)
        .map((f) => f.element),
      {
        id: "seamOut",
        lane: "Seam",
        label: "Seam out",
        start: B.seamOut,
        length: B.seamOutLen,
        follows: "seam",
      },
      {
        id: "lock",
        lane: "Camera",
        label: "Punch",
        start: B.lock,
        length: 8,
        follows: "mark",
        beats: { peak: 2 },
      },
      {
        id: "cool",
        lane: "Letters",
        label: "Cool",
        start: B.cool,
        length: B.coolLen,
        follows: "lock",
      },
    ];
    tagline.split(" ").forEach((w, i) => {
      elements.push({
        id: `word:${i}`,
        lane: "Tagline",
        label: w,
        start: B.tagline + i * 2,
        length: 14,
        follows: i > 0 ? `word:${i - 1}` : "cool",
      });
    });
    return elements
      .map((e, k) => ({ e, k }))
      .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
      .map(({ e }) => e);
  },
);
