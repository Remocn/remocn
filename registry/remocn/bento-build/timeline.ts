import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The heading, the camera easing in, each tile flying into the grid, then the
// spotlight moving across the tiles in `highlightOrder`. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type BentoBuildElementId =
  | "head"
  | "camera"
  | `tile:${number}`
  | `spot:${number}`;

export type BentoVisual =
  | "chart"
  | "toggle"
  | "code"
  | "chips"
  | "avatars"
  | "none";

/** A tile's copy, layout and visual: `BentoTile` without the icon. */
export interface BentoTileCopy {
  title: string;
  description: string;
  span: [number, number];
  visual?: BentoVisual;
}

export interface BentoBuildTimingProps {
  tiles?: { title: string }[];
  highlightOrder?: number[];
  stagger?: number;
  hold?: number;
}

export const DEFAULT_TILES: BentoTileCopy[] = [
  {
    title: "Renders you can measure.",
    description: "Every export is tracked, so you know which beat lands.",
    span: [2, 2],
    visual: "chart",
  },
  {
    title: "Motion presets.",
    description: "Springs tuned for 30fps.",
    span: [2, 1],
    visual: "toggle",
  },
  {
    title: "Own your code.",
    description: "It lands in your repo.",
    span: [1, 1],
    visual: "code",
  },
  {
    title: "Brand tokens.",
    description: "One accent, whole video.",
    span: [1, 1],
    visual: "chips",
  },
  {
    title: "124 components.",
    description: "Transitions, text, captions and full scenes.",
    span: [2, 1],
    visual: "chips",
  },
  {
    title: "Built for two.",
    description: "Review cuts together, ship on time.",
    span: [2, 1],
    visual: "avatars",
  },
];

export const BUILD_STAGGER = 3;
export const HIGHLIGHT_LEN = 30;
export const DEFAULT_HIGHLIGHTS = [0, 1, 4];
const HIGHLIGHT_START = 46;
const TILE_AT = 4;

// `head` fades the eyebrow in over its length, the heading from `headingAt`
// over `heading`. `camera` eases the grid up to full size. `tile:<i>` flies
// tile `i` in (a chain); it locks with a click at `lock` (peaking `clickPeak`
// later, gone after `click`), its text rises from `textAt` over `text` and
// its visual reveals from `revealAt` over `reveal`. `spot:<k>` holds the
// spotlight on tile `highlightOrder[k]` for its length, easing in and out
// over `ease` on both sides of each end (a chain).
export const bentoBuildTimeline = defineTimeline<
  BentoBuildElementId,
  BentoBuildTimingProps
>(
  ({
    tiles = DEFAULT_TILES,
    highlightOrder = DEFAULT_HIGHLIGHTS,
    stagger = BUILD_STAGGER,
    hold = HIGHLIGHT_LEN,
  }) => {
    const buildEnd = stagger * tiles.length + 26;
    const elements: TimelineElement<BentoBuildElementId>[] = [
      {
        id: "head",
        lane: "Heading",
        label: "Heading",
        start: 0,
        length: 12,
        beats: { headingAt: 2, heading: 16 },
      },
      {
        id: "camera",
        lane: "Camera",
        label: "Camera",
        start: 0,
        length: buildEnd + 6,
      },
    ];
    tiles.forEach((tile, i) => {
      elements.push({
        id: `tile:${i}`,
        lane: "Tiles",
        label: tile.title,
        start: TILE_AT + i * stagger,
        length: 19,
        follows: i > 0 ? `tile:${i - 1}` : undefined,
        beats: {
          lock: 12,
          clickPeak: 2,
          click: 7,
          textAt: 4,
          text: 12,
          revealAt: 8,
          reveal: 30,
        },
      });
    });
    highlightOrder.forEach((idx, k) => {
      elements.push({
        id: `spot:${k}`,
        lane: "Spotlight",
        label: tiles[idx]?.title ?? `Tile ${idx + 1}`,
        start: HIGHLIGHT_START + k * hold,
        length: hold,
        follows: k > 0 ? `spot:${k - 1}` : undefined,
        beats: { ease: 5 },
      });
    });
    return elements
      .map((e, k) => ({ e, k }))
      .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
      .map(({ e }) => e);
  },
);
