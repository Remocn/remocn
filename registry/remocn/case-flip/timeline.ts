import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising in, the guides drawing out, each glyph flipping to capitals
// in the first wave and to its final casing in the second, and the settle
// (guides fading, the halo drifting on the accent word). Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type CaseFlipElementId =
  | "enter"
  | "guides"
  | `upper:${number}`
  | `final:${number}`
  | "settle";

export interface CaseFlipTimingProps {
  text?: string;
  stagger?: number;
  flip?: number;
  pause?: number;
}

export const DEFAULT_TEXT = "Launch it LOUD";
const FLIP = 10;
const STAGGER = 2;
const PAUSE = 12;
const ENTER = 14;
const GUIDES_AT = 2;
const GUIDES_IN = 20;
const WAVE1 = 16;
const GUIDES_OUT = 20;
const DRIFT = 50;

// `upper:<i>` and `final:<i>` are the flips of character `i` of `text`
// (spaces have none). Each wave is a chain; the second follows the first's
// last flip after `pause`, and the settle follows the second's last flip.
// The settle's `guides` beat is how long the guides take to fade.
export const caseFlipTimeline = defineTimeline<
  CaseFlipElementId,
  CaseFlipTimingProps
>(({ text = DEFAULT_TEXT, stagger = STAGGER, flip = FLIP, pause = PAUSE }) => {
  const chars = [...text];
  const n = chars.length;
  const wave1 = WAVE1;
  const wave2 = wave1 + (n - 1) * stagger + flip + pause;
  const settled = wave2 + (n - 1) * stagger + flip;
  const glyphs = chars
    .map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => ch !== " ");

  const elements: TimelineElement<CaseFlipElementId>[] = [
    { id: "enter", lane: "Line", label: "enter", start: 0, length: ENTER },
    {
      id: "guides",
      lane: "Guides",
      label: "guides",
      start: GUIDES_AT,
      length: GUIDES_IN,
    },
  ];
  glyphs.forEach(({ ch, i }, k) => {
    elements.push({
      id: `upper:${i}`,
      lane: "Upper",
      label: ch,
      start: wave1 + i * stagger,
      length: flip,
      follows: k > 0 ? `upper:${glyphs[k - 1].i}` : undefined,
    });
  });
  const lastUpper = glyphs.length
    ? (`upper:${glyphs[glyphs.length - 1].i}` as const)
    : undefined;
  glyphs.forEach(({ ch, i }, k) => {
    elements.push({
      id: `final:${i}`,
      lane: "Final",
      label: ch,
      start: wave2 + i * stagger,
      length: flip,
      follows: k > 0 ? `final:${glyphs[k - 1].i}` : lastUpper,
    });
  });
  elements.push({
    id: "settle",
    lane: "Line",
    label: "settle",
    start: settled,
    length: DRIFT,
    follows: glyphs.length ? `final:${glyphs[glyphs.length - 1].i}` : undefined,
    beats: { guides: GUIDES_OUT },
  });
  return elements.sort((a, b) => a.start - b.start);
});
