import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The corner bug and the label fading in, the symbol rising letter by letter
// out of its baseline, the IPO price and its chip settling underneath, the
// bell (a two-frame flash, the symbol's kick, the shockwave settling into a
// rule), the opening print racing up on its reels, and the land, where the
// chip pops into the gradient. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type IpoOpenElementId =
  | "corner"
  | "label"
  | `letter:${number}`
  | `glyph:${number}`
  | "chip"
  | "bell"
  | "race"
  | "land";

export interface IpoOpenTimingProps {
  symbol?: string;
  openPrice?: number;
  countLength?: number;
}

const BELL = 34;
const RACE_AT = 37;
const RACE_LEN = 50;

/** The price's glyphs as it lands, left to right: "$", digits, ".", cents. */
function landedGlyphs(openPrice: number) {
  const c = Math.round(openPrice * 100);
  return Array.from(
    `$${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`,
  );
}

// `corner` fades in the logo and clock, `label` the line above the symbol.
// `letter:<i>` raises letter `i` of the symbol and `glyph:<i>` glyph `i` of
// the price ("$", digits, "."), each list a chain; `chip` brings in the tag.
// `bell` flashes for `flash` frames, kicks the symbol over `kick`, tears the
// shockwave out over `shock` and a second one from `shock2At` to
// `shock2End`, settles the rule from `ruleAt` to `ruleEnd` and lifts the
// ground over `glow`. `race` runs the price up over its length, and `land`
// pops the chip from `popAt` through `popPeak` to `popEnd`, fills it from
// `fillAt` to `fillEnd` and lifts the ground from `glowAt` to `glowEnd`.
export const ipoOpenTimeline = defineTimeline<
  IpoOpenElementId,
  IpoOpenTimingProps
>(({ symbol = "RMCN", openPrice = 42.6, countLength = RACE_LEN }) => {
  const letters = Array.from(symbol.toUpperCase());
  const glyphs = landedGlyphs(openPrice);
  const elements: TimelineElement<IpoOpenElementId>[] = [
    { id: "corner", lane: "Frame", label: "Corner bug", start: -6, length: 14 },
    { id: "label", lane: "Frame", label: "Label", start: 0, length: 14 },
    ...letters.map(
      (ch, i): TimelineElement<IpoOpenElementId> => ({
        id: `letter:${i}`,
        lane: "Symbol",
        label: ch,
        start: 4 + i * 3,
        length: 16,
        follows: i > 0 ? `letter:${i - 1}` : undefined,
      }),
    ),
    ...glyphs.map(
      (g, i): TimelineElement<IpoOpenElementId> => ({
        id: `glyph:${i}`,
        lane: "Price",
        label: g,
        start: 14 + i * 2,
        length: 16,
        follows: i > 0 ? `glyph:${i - 1}` : undefined,
      }),
    ),
    { id: "chip", lane: "Chip", label: "Chip", start: 18, length: 16 },
    {
      id: "bell",
      lane: "Bell",
      label: "Bell",
      start: BELL,
      length: 26,
      beats: {
        flash: 2,
        kick: 14,
        shock: 16,
        shock2At: 3,
        shock2End: 22,
        ruleAt: 10,
        ruleEnd: 26,
        glow: 10,
      },
    },
    {
      id: "race",
      lane: "Price",
      label: "Opening print",
      start: RACE_AT,
      length: countLength,
      follows: "bell",
    },
    {
      id: "land",
      lane: "Chip",
      label: "Land",
      start: RACE_AT + countLength,
      length: 16,
      follows: "race",
      beats: {
        popAt: -2,
        popPeak: 5,
        popEnd: 14,
        fillAt: -2,
        fillEnd: 4,
        glowAt: -4,
        glowEnd: 16,
      },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
