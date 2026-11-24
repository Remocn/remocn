import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The evening line rising in, the night panel coming down over it and the
// morning panel rising over the night. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type OvernightElementId = "evening" | "dusk" | "dawn";

export interface OvernightTimingProps {
  nightAt?: number;
  morningAt?: number;
}

export const NIGHT_AT = 52;
export const MORNING_AT = 118;
const DUSK = 26;
const DAWN = 22;

// A panel's text rises once the panel has covered the text before it, a
// moment the component measures; its `slug` and `line` beats are how long
// the slug and the line rise, `lineLag` how far the line trails the slug.
const PANEL_TEXT = { slug: 14, lineLag: 3, line: 18 };

// `length` is the clip length without `speed`: the panels keep their places
// on a 180-frame clip and scale with longer or shorter ones. The dawn
// follows the dusk.
export const overnightTimeline = defineTimeline<
  OvernightElementId,
  OvernightTimingProps
>(({ nightAt = NIGHT_AT, morningAt = MORNING_AT }, { length }) => {
  const k = Math.min(1.6, Math.max(0.75, length / 180));
  const at = (f: number) => f * k;
  const duskA = at(nightAt);
  const duskB = at(nightAt + DUSK);
  const dawnA = at(morningAt);
  const dawnB = at(morningAt + DAWN);
  const elements: TimelineElement<OvernightElementId>[] = [
    {
      id: "evening",
      lane: "Text",
      label: "evening",
      start: 2,
      length: 24,
      beats: { slug: 16, lineAt: 2, line: 22 },
    },
    {
      id: "dusk",
      lane: "Panels",
      label: "night",
      start: duskA,
      length: duskB - duskA,
      beats: PANEL_TEXT,
    },
    {
      id: "dawn",
      lane: "Panels",
      label: "morning",
      start: dawnA,
      length: dawnB - dawnA,
      follows: dawnA >= duskA ? "dusk" : undefined,
      beats: PANEL_TEXT,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
