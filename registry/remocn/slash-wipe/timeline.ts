import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The logo fading in, each section arriving, and the slash wiping each
// section out for the next. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type SlashWipeElementId =
  | "logo"
  | `section:${number}`
  | `wipe:${number}`;

export interface SectionText {
  title: string;
  sub?: string;
}

export interface SlashWipeTimingProps {
  sections?: SectionText[];
  every?: number;
}

export const DEFAULT_SECTIONS: SectionText[] = [
  { title: "captions", sub: "31 caption styles that follow every word." },
  { title: "transitions", sub: "Cuts that land on the beat." },
];

/** The sections shown: up to five, the defaults when the list is empty. */
export function sectionsOf(sections: SectionText[]) {
  return sections.length >= 1 ? sections.slice(0, 5) : DEFAULT_SECTIONS;
}

const FIRST_WIPE = 22;

// `section:0` rises in from the start: `rise` for the title, `glyph` for the
// slash glyph. Every later section slides in after the wipe before it
// (`slide`). A section's subtitle fades in from `sub` over `subLen`. A wipe
// stretches the slash to full height over `stretch`; its leading edge runs
// from `lead` to `leadEnd`, its trailing edge from `trail` to the end. The
// wipes form a chain and each section after the first follows its wipe.
export const slashWipeTimeline = defineTimeline<
  SlashWipeElementId,
  SlashWipeTimingProps
>(({ sections = DEFAULT_SECTIONS, every = 56 }) => {
  const list = sectionsOf(sections);
  const n = list.length;
  const T = (j: number) => FIRST_WIPE + j * every;
  const elements: TimelineElement<SlashWipeElementId>[] = [
    { id: "logo", lane: "Logo", label: "Logo", start: 0, length: 16 },
    {
      id: "section:0",
      lane: "Sections",
      label: list[0].title,
      start: 0,
      length: 24,
      beats: { rise: 16, glyph: 14, sub: 8, subLen: 16 },
    },
  ];
  for (let j = 0; j < n - 1; j++) {
    elements.push({
      id: `wipe:${j}`,
      lane: "Wipes",
      label: `Wipe to ${list[j + 1].title}`,
      start: T(j),
      length: 30,
      follows: j > 0 ? `wipe:${j - 1}` : undefined,
      beats: { stretch: 8, lead: 6, leadEnd: 24, trail: 10 },
    });
    elements.push({
      id: `section:${j + 1}`,
      lane: "Sections",
      label: list[j + 1].title,
      start: T(j) + 12,
      length: 26,
      follows: `wipe:${j}`,
      beats: { slide: 22, sub: 10, subLen: 16 },
    });
  }
  return elements.sort((a, b) => a.start - b.start);
});
