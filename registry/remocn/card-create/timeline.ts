import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The wallet page coming in, then the finger: it taps New card (the stack
// leaves, a slot opens, the new card prints), taps three finishes, the Name
// tab (the holder's name engraves), the Details tab (the card flips), the
// reveal (the number unscrambles) and Add to wallet (the card drops into the
// wallet and the toast pops). The copy lines beside the phone change with
// the beats. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type CardCreateElementId =
  | "page"
  | "camera"
  | `line:${number}`
  | "reach"
  | "new"
  | "out"
  | "slot"
  | "print"
  | `swatch:${number}`
  | "name"
  | "engrave"
  | "details"
  | "flip"
  | "reveal"
  | "scramble"
  | "add"
  | "wallet";

export interface CardCreateTimingProps {
  holder?: string;
}

export const DEFAULT_HOLDER = "Maya Chen";

const REACH = 44;
const TAP_NEW = 62;
const OUT = 64;
const SLOT = 72;
const PRINT = 84;
const SWATCH_TAPS = [136, 150, 164];
const NAME_TAB = 182;
const ENGRAVE = 188;
const DETAILS_TAB = 222;
const FLIP = 226;
const REVEAL_TAP = 256;
const SCRAMBLE = 258;
const ADD_TAP = 302;
const WALLET = 306;
/** Digits the scramble settles, `DIGIT` apart. */
const DIGITS = 15;
const DIGIT = 0.9;
const LETTER = 2.4;
/** A tap presses from `pressIn` and releases at `pressOut`, around its frame. */
const TAP = { pressIn: -1, pressOut: 5 };
/** A tab tap switches the tool a frame later; its hint swaps in and out. */
const TAB = { ...TAP, switchAt: 1, hintAt: 2, hintIn: 6, hintOut: 4 };

// `page` rises the phone in: the cards stack in from `stackAt`, `stack`
// apart, and the title at `titleAt`. `camera` is the slow push across the
// clip. `line:<i>` brings copy line `i` in over `rise` and out from
// `outLead` before its end to `out` after it (a chain). On the finger's lane
// each tap presses from `pressIn` to `pressOut`: `reach` brings the finger
// in (fading over `fadeIn`), `new` taps New card (the finger fades from
// `fadeAt` to `fadeEnd`), `swatch:<i>` taps a finish (the colour wipes from
// `wipeAt` over `wipe`; the first one brings the finger back from `showAt`
// to `showEnd`), `name` and `details` switch tabs at `switchAt` and swap the
// hint in from `hintAt` over `hintIn` and out over `hintOut`, `reveal` taps
// the eye, and `add` taps Add to wallet (the sheet leaves from `hideAt` over
// `hide`, the finger fades from `fadeAt` to `fadeEnd`). On the card's lane:
// `out` sends the stack away, `stagger` apart; `slot` opens the slot (the
// editor comes in at `custAt`); `print` prints the card over its length
// (the light sweeps from `sweepAt` to `sweepEnd`, the slot clips it until
// `clipEnd` and fades from `slotOutAt` to `slotOutEnd`, swatches come in from
// `swatchesAt`, `swatch` apart, tools from `toolsAt`, `tool` apart, the
// button at `ctaAt` and the first hint at `hintAt` over `hintIn`);
// `engrave` engraves a letter every `letter`, each settling over `settle`;
// `flip` turns the card; `scramble` settles a digit every `digit`, each
// over `settle`; `wallet` drops the card in: the wallet's cards come back
// from `backAt`, `stack` apart, and the toast at `toastAt`.
export const cardCreateTimeline = defineTimeline<
  CardCreateElementId,
  CardCreateTimingProps
>(({ holder = DEFAULT_HOLDER }) => {
  const letters = holder.toUpperCase().split("").length;
  const beats = [0, SWATCH_TAPS[0] - 14, NAME_TAB - 2, DETAILS_TAB - 2, WALLET];
  const lineAt = beats.map((at, i) => at + (i === 0 ? 8 : 0));
  const elements: TimelineElement<CardCreateElementId>[] = [
    {
      id: "page",
      lane: "Phone",
      label: "Wallet",
      start: 0,
      length: REACH,
      beats: { stackAt: 8, stack: 6, titleAt: 28 },
    },
    { id: "camera", lane: "Camera", label: "Push-in", start: 0, length: 370 },
    {
      id: "reach",
      lane: "Finger",
      label: "Reach",
      start: REACH,
      length: TAP_NEW - REACH,
      beats: { fadeIn: 8 },
    },
    {
      id: "new",
      lane: "Finger",
      label: "Tap New card",
      start: TAP_NEW,
      length: SWATCH_TAPS[0] - TAP_NEW,
      follows: "reach",
      beats: { ...TAP, fadeAt: 6, fadeEnd: 14 },
    },
    {
      id: "out",
      lane: "Card",
      label: "Stack out",
      start: OUT,
      length: SLOT - OUT,
      follows: "new",
      beats: { stagger: 3 },
    },
    {
      id: "slot",
      lane: "Card",
      label: "Slot",
      start: SLOT,
      length: PRINT - SLOT,
      follows: "out",
      beats: { custAt: 6 },
    },
    {
      id: "print",
      lane: "Card",
      label: "Print",
      start: PRINT,
      length: 30,
      follows: "slot",
      beats: {
        sweepAt: 18,
        sweepEnd: 40,
        clipEnd: 32,
        slotOutAt: 34,
        slotOutEnd: 44,
        swatchesAt: 20,
        swatch: 2,
        toolsAt: 28,
        tool: 3,
        ctaAt: 34,
        hintAt: 34,
        hintIn: 6,
      },
    },
  ];
  SWATCH_TAPS.forEach((at, i) => {
    elements.push({
      id: `swatch:${i}`,
      lane: "Finger",
      label: `Finish ${i + 1}`,
      start: at,
      length: (SWATCH_TAPS[i + 1] ?? NAME_TAB) - at,
      follows: i > 0 ? `swatch:${i - 1}` : "new",
      beats:
        i === 0
          ? { ...TAP, wipeAt: 1, wipe: 12, showAt: -16, showEnd: -8 }
          : { ...TAP, wipeAt: 1, wipe: 12 },
    });
  });
  elements.push(
    {
      id: "name",
      lane: "Finger",
      label: "Name tab",
      start: NAME_TAB,
      length: DETAILS_TAB - NAME_TAB,
      follows: `swatch:${SWATCH_TAPS.length - 1}`,
      beats: TAB,
    },
    {
      id: "engrave",
      lane: "Card",
      label: "Engrave",
      start: ENGRAVE,
      length: Math.max(0, letters - 1) * LETTER + 5,
      follows: "name",
      beats: { letter: LETTER, settle: 5 },
    },
    {
      id: "details",
      lane: "Finger",
      label: "Details tab",
      start: DETAILS_TAB,
      length: REVEAL_TAP - DETAILS_TAB,
      follows: "name",
      beats: TAB,
    },
    {
      id: "flip",
      lane: "Card",
      label: "Flip",
      start: FLIP,
      length: SCRAMBLE - FLIP,
      follows: "details",
    },
    {
      id: "reveal",
      lane: "Finger",
      label: "Reveal",
      start: REVEAL_TAP,
      length: ADD_TAP - REVEAL_TAP,
      follows: "details",
      beats: TAP,
    },
    {
      id: "scramble",
      lane: "Card",
      label: "Number",
      start: SCRAMBLE,
      length: (DIGITS - 1) * DIGIT + 4,
      follows: "reveal",
      beats: { digit: DIGIT, settle: 4 },
    },
    {
      id: "add",
      lane: "Finger",
      label: "Add to wallet",
      start: ADD_TAP,
      length: WALLET - ADD_TAP,
      follows: "reveal",
      beats: { ...TAP, hideAt: 1, hide: 6, fadeAt: 5, fadeEnd: 11 },
    },
    {
      id: "wallet",
      lane: "Card",
      label: "Into the wallet",
      start: WALLET,
      length: 26,
      follows: "add",
      beats: { backAt: 6, stack: 3, toastAt: 26 },
    },
  );
  lineAt.forEach((at, i) => {
    const next = lineAt[i + 1];
    elements.push({
      id: `line:${i}`,
      lane: "Copy",
      label: `Line ${i + 1}`,
      start: at,
      length: next === undefined ? 14 : next - at,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: { rise: 14, outLead: 2, out: 6 },
    });
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
