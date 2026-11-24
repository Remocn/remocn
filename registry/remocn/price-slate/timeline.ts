import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The brand and lead-in rising in, the old price rolling in on reels, the
// strike through it and its step aside, the new price's reels spinning into
// the hero slot, the halo gradient sweeping across it as it lands, then the
// note and the availability line. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type PriceSlateElementId =
  | "brand"
  | "lead"
  | "old"
  | "strike"
  | "aside"
  | "new"
  | "halo"
  | "note"
  | "availability";

export interface PriceSlateTimingProps {
  price?: string;
  was?: string;
  reelLength?: number;
}

export const isDigit = (ch: string) => ch >= "0" && ch <= "9";

const STRIKE_AT = 22;
const MOVE_AT = 34;
const MOVE_LEN = 18;
const REEL_AT = 47;
const REEL_LEN = 24;

const digitsIn = (s: string) => Array.from(s).filter(isDigit).length;

// `old` and `new` roll a price in on reels. Reel `j` starts `j * stagger`
// after the element and spins for `reel + (j + 1) * spin`, fading in from
// `showAt` to `showEnd` around its own start; mark `i` (a "$" or ".") rises
// from `lag + i * markStep` over `markIn`. `strike` draws the line through the
// old price and `aside` shrinks it and slides it left. `halo` sweeps the
// gradient across the new price as its last reel lands; `note` and
// `availability` rise in after it. One chain from `old` on.
export const priceSlateTimeline = defineTimeline<
  PriceSlateElementId,
  PriceSlateTimingProps
>(({ price = "$0", was = "$29", reelLength = REEL_LEN }) => {
  const oldReels = digitsIn(was);
  const reels = digitsIn(price);
  const landAt = REEL_AT + Math.max(0, reels - 1) * 3 + reelLength + reels * 2;
  const reelBeats = (reel: number, lag: number) => ({
    reel,
    stagger: 3,
    spin: 2,
    showAt: -2,
    showEnd: 6,
    lag,
    markStep: 2,
    markIn: 12,
  });
  const elements: TimelineElement<PriceSlateElementId>[] = [
    { id: "brand", lane: "Copy", label: "Brand", start: -8, length: 20 },
    { id: "lead", lane: "Old price", label: "Lead-in", start: -6, length: 18 },
    {
      id: "old",
      lane: "Old price",
      label: was,
      start: 0,
      length: Math.max(0, oldReels - 1) * 3 + 20 + oldReels * 2,
      beats: reelBeats(20, -8),
    },
    {
      id: "strike",
      lane: "Old price",
      label: "Strike",
      start: STRIKE_AT,
      length: 12,
      follows: "old",
    },
    {
      id: "aside",
      lane: "Old price",
      label: "Step aside",
      start: MOVE_AT,
      length: MOVE_LEN,
      follows: "strike",
    },
    {
      id: "new",
      lane: "New price",
      label: price,
      start: REEL_AT,
      length: landAt - REEL_AT,
      follows: "aside",
      beats: reelBeats(reelLength, 0),
    },
    {
      id: "halo",
      lane: "New price",
      label: "Halo",
      start: landAt - 4,
      length: 22,
      follows: "new",
    },
    {
      id: "note",
      lane: "Copy",
      label: "Note",
      start: landAt - 2,
      length: 20,
      follows: "halo",
    },
    {
      id: "availability",
      lane: "Copy",
      label: "Availability",
      start: landAt + 6,
      length: 20,
      follows: "note",
    },
  ];
  return elements;
});
