import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure's dots popping in on a card, the card's ruler ticking up, the
// leader line and the note beside it, a wave through the dots and the solid
// figure resolving left to right, the note leaving, then the card collapsing
// into the figure as it flies into the final line, the word typing in after
// it and the logo popping above. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type FigureToLabelElementId =
  | "dots"
  | "card"
  | "ruler"
  | "leader"
  | "note"
  | "wave"
  | "resolve"
  | "exit"
  | "collapse"
  | "caret"
  | `char:${number}`
  | "logo";

export interface FigureToLabelTimingProps {
  word?: string;
  stagger?: number;
}

const BEAT = {
  card: -3,
  dots: -8,
  dotsLen: 27,
  line: 9,
  note: 15,
  wave: 15,
  waveLen: 18,
  resolve: 33,
  resolveLen: 15,
  exit: 51,
  collapse: 54,
  type: 69,
  logo: 75,
  caretOff: 117,
};
const CHAR_STEP = 2;

// `dots` pops the figure's dots in, each at a random moment within `spread`
// of its start. `card` springs the card in from its start and `ruler` ticks
// its 25 ticks up, tick `i` from `i * tickStep` over `tick`. `leader` draws
// the line to the note and `note` springs its logo and wipes its word in.
// `wave` runs a swell through the dots and `resolve` turns them into the
// solid figure, left to right; `exit` sends the note away. `collapse`
// springs the card into the figure's final place, fading the card from
// `fadeAt` to `fadeEnd` and tinting the figure from `colorAt` to `colorEnd`.
// `caret` shows the caret until its end; `char:<i>` types letter `i` of the
// word, a chain, and the caret blinks once the last one is in. `logo` springs
// the mark above the line and wipes the eyebrow in from `eyebrowAt` to
// `eyebrowEnd`.
export const figureToLabelTimeline = defineTimeline<
  FigureToLabelElementId,
  FigureToLabelTimingProps
>(({ word = "valuation", stagger = CHAR_STEP }) => {
  const chars = Array.from(word);
  const elements: TimelineElement<FigureToLabelElementId>[] = [
    {
      id: "dots",
      lane: "Figure",
      label: "Dots",
      start: BEAT.dots,
      length: BEAT.dotsLen,
      beats: { spread: BEAT.dotsLen - 8 },
    },
    { id: "card", lane: "Card", label: "Card", start: BEAT.card, length: 20 },
    {
      id: "ruler",
      lane: "Card",
      label: "Ruler",
      start: BEAT.line,
      length: 9 + 24 * 0.6,
      follows: "card",
      beats: { tick: 9, tickStep: 0.6 },
    },
    {
      id: "leader",
      lane: "Note",
      label: "Leader line",
      start: BEAT.line,
      length: 12,
    },
    {
      id: "note",
      lane: "Note",
      label: "Note",
      start: BEAT.note,
      length: 12,
      follows: "leader",
    },
    {
      id: "wave",
      lane: "Figure",
      label: "Wave",
      start: BEAT.wave,
      length: BEAT.waveLen,
      follows: "dots",
    },
    {
      id: "resolve",
      lane: "Figure",
      label: "Resolve",
      start: BEAT.resolve,
      length: BEAT.resolveLen,
      follows: "wave",
    },
    {
      id: "exit",
      lane: "Note",
      label: "Note out",
      start: BEAT.exit,
      length: 8,
      follows: "note",
    },
    {
      id: "collapse",
      lane: "Card",
      label: "Collapse",
      start: BEAT.collapse,
      length: 18,
      follows: "resolve",
      beats: { fadeAt: 2, fadeEnd: 14, colorAt: 4, colorEnd: 18 },
    },
    {
      id: "caret",
      lane: "Caret",
      label: "Caret",
      start: BEAT.type - 4,
      length: BEAT.caretOff - (BEAT.type - 4),
      follows: "collapse",
    },
    ...chars.map(
      (ch, i): TimelineElement<FigureToLabelElementId> => ({
        id: `char:${i}`,
        lane: "Word",
        label: ch,
        start: BEAT.type + i * stagger,
        length: stagger,
        follows: i > 0 ? `char:${i - 1}` : "caret",
      }),
    ),
    {
      id: "logo",
      lane: "Logo",
      label: "Logo",
      start: BEAT.logo,
      length: 15,
      follows: "collapse",
      beats: { eyebrowAt: 3, eyebrowEnd: 15 },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
