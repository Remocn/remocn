import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The button that becomes a product: the pill rises, the cursor presses it
// and it morphs into the new-product card, the fields rise, the title types,
// an image is carried in and dropped, the price types, the status flips,
// save is pressed and the card shrinks into the first tile of the store
// while the other tiles, the header and the Live badge pop in. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type ButtonToCardElementId =
  | "pill"
  | "press"
  | "morph"
  | "fields"
  | "title"
  | "carry"
  | "price"
  | "drop"
  | "status"
  | "save"
  | "shrink"
  | `pop:${number}`
  | "header"
  | "live";

export interface ButtonToCardTimingProps {
  name?: string;
  price?: string;
  others?: { name: string; price: string }[];
}

export const DEFAULT_NAME = "Ceramic pitcher";
export const DEFAULT_PRICE = "$48.00";
export const DEFAULT_OTHERS = [
  { name: "Oak stool", price: "$120.00" },
  { name: "Arch sculpture", price: "$86.00" },
  { name: "Material kit", price: "$32.00" },
];

const B = {
  pill: -8,
  press: 18,
  morph: 22,
  fields: 24,
  title: 36,
  carry: 50,
  price: 54,
  drop: 78,
  status: 88,
  save: 96,
  shrink: 102,
  pops: [106, 110, 114],
  header: 108,
  live: 120,
  end: 162,
};

// Beats are counted from their element's start; `cursorAt` and the like are
// the cursor's waypoints on the way through. The card's fields rise `step`
// apart over `field` each. A typed field shows one more character every
// `char` frames. The carried image attaches to the cursor at `attachAt` and
// the drop slot glows from `hotAt`; the drop places it at `placed`.
export const buttonToCardTimeline = defineTimeline<
  ButtonToCardElementId,
  ButtonToCardTimingProps
>(
  ({
    name = DEFAULT_NAME,
    price = DEFAULT_PRICE,
    others = DEFAULT_OTHERS,
  }): TimelineElement<ButtonToCardElementId>[] => {
    const tiles = [{ name, price }, ...others].slice(0, 4).slice(1);
    const elements: TimelineElement<ButtonToCardElementId>[] = [
      {
        id: "pill",
        lane: "Card",
        label: "button",
        start: B.pill,
        length: B.press - B.pill,
        beats: { cursorAt: 2, cursorIn: 8 },
      },
      {
        id: "press",
        lane: "Cursor",
        label: "press",
        start: B.press,
        length: B.morph - B.press,
        follows: "pill",
        beats: { cursorAt: -2 },
      },
      {
        id: "morph",
        lane: "Card",
        label: "button to card",
        start: B.morph,
        length: 22,
        follows: "press",
        beats: { labelOut: 6, camAt: -4, cam: 26, cursorAt: 8, cursorAway: 24 },
      },
      {
        id: "fields",
        lane: "Form",
        label: "fields",
        start: B.fields,
        length: 27,
        follows: "morph",
        beats: { step: 3, field: 12 },
      },
      {
        id: "title",
        lane: "Typing",
        label: name,
        start: B.title,
        length: name.length,
        follows: "morph",
        beats: { caretAt: -4, char: 1 },
      },
      {
        id: "carry",
        lane: "Image",
        label: "carry image",
        start: B.carry,
        length: B.drop - B.carry,
        follows: "title",
        beats: { attachAt: -2, attach: 6, hotAt: 16, hot: 8 },
      },
      {
        id: "price",
        lane: "Typing",
        label: price,
        start: B.price,
        length: price.length * 1.5,
        follows: "title",
        beats: { char: 1.5 },
      },
      {
        id: "drop",
        lane: "Image",
        label: "drop image",
        start: B.drop,
        length: 10,
        follows: "carry",
        beats: {
          detachAt: 2,
          detach: 8,
          hotOutAt: 4,
          hotOut: 8,
          placed: 10,
          cursorAt: 10,
        },
      },
      {
        id: "status",
        lane: "Form",
        label: "active",
        start: B.status,
        length: B.save - B.status,
        follows: "price",
      },
      {
        id: "save",
        lane: "Cursor",
        label: "save",
        start: B.save,
        length: B.shrink - B.save,
        follows: "status",
        beats: { cursorAt: -4 },
      },
      {
        id: "shrink",
        lane: "Card",
        label: "card to tile",
        start: B.shrink,
        length: 26,
        follows: "save",
        beats: {
          contentOut: 8,
          tileAt: 12,
          tile: 12,
          cursorOutAt: 6,
          cursorOut: 8,
          cursorAway: 18,
          pushAt: 10,
          push: B.end - B.shrink,
        },
      },
      {
        id: "header",
        lane: "Store",
        label: "store header",
        start: B.header,
        length: 14,
        follows: "shrink",
      },
      {
        id: "live",
        lane: "Store",
        label: "live",
        start: B.live,
        length: 10,
        follows: "header",
      },
    ];
    tiles.forEach((tile, j) => {
      elements.push({
        id: `pop:${j}`,
        lane: "Tiles",
        label: tile.name,
        start: B.pops[j] ?? B.pops[B.pops.length - 1] + j * 4,
        length: 4,
        follows: j > 0 ? `pop:${j - 1}` : "shrink",
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
