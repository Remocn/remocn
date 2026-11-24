import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The headline rises word by word while photos pop in around it and drift;
// the headline blurs out as the photos converge into a row, the logo
// reveals beside it and the row lands and pushes in. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type PhotoHaloElementId =
  | `word:${number}`
  | "photos"
  | "converge"
  | "text-out"
  | "logo"
  | "land";

export interface PhotoHaloTimingProps {
  words?: string[];
  stagger?: number;
}

export const DEFAULT_WORDS = [
  "Launch",
  "films",
  "for",
  "everything",
  "you",
  "ship",
];
export const DEFAULT_STAGGER = 3;
const WORDS_AT = -6;
const WORD_RISE = 12;
const POPS_AT = 6;
const CONVERGE_AT = 72;
const LOGO_AT = 90;
const LAND_AT = 96;
const END = 138;

// Words are a chain, the first starting before the first frame. The photos
// pop in from the start of `photos`, each on its own offset, and drift
// until the converge; each photo leaves for the row on its own offset from
// the converge's start. The logo reveals over its length while the row
// slides over in `rowShift`; the land punches and pushes in to the end.
export const photoHaloTimeline = defineTimeline<
  PhotoHaloElementId,
  PhotoHaloTimingProps
>(({ words = DEFAULT_WORDS, stagger = DEFAULT_STAGGER }) => {
  const elements: TimelineElement<PhotoHaloElementId>[] = words.map(
    (word, i) => ({
      id: `word:${i}` as const,
      lane: "Headline",
      label: word,
      start: WORDS_AT + i * stagger,
      length: WORD_RISE,
      follows: i > 0 ? (`word:${i - 1}` as const) : undefined,
    }),
  );
  elements.push(
    {
      id: "photos",
      lane: "Photos",
      label: "Photos pop in",
      start: POPS_AT,
      length: CONVERGE_AT - POPS_AT,
    },
    {
      id: "converge",
      lane: "Photos",
      label: "Photos converge",
      start: CONVERGE_AT,
      length: LOGO_AT - CONVERGE_AT,
      follows: "photos",
    },
    {
      id: "text-out",
      lane: "Headline",
      label: "Headline out",
      start: CONVERGE_AT,
      length: 8,
      follows: "photos",
    },
    {
      id: "logo",
      lane: "Logo",
      label: "Logo",
      start: LOGO_AT,
      length: 12,
      follows: "converge",
      beats: { rowShift: 16 },
    },
    {
      id: "land",
      lane: "Photos",
      label: "Row lands",
      start: LAND_AT,
      length: END - LAND_AT,
      follows: "converge",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
