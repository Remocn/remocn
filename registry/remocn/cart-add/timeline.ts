import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A product page: the store window rises in, the cursor picks a color and a
// size, presses Add to bag, the product flies into the bag and the badge
// bumps, then the cart drawer slides in and the cursor heads for Checkout.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type CartAddElementId =
  | "app"
  | "cursor"
  | "color"
  | "size"
  | "add"
  | "fly"
  | "land"
  | "drawer"
  | "checkout";

/** The scene's timing does not depend on its props. */
export type CartAddTimingProps = object;

// `app` rises the store window in on a spring, fading over its length.
// `cursor` fades the cursor in and sends it to the swatch. `color` clicks
// the swatch: the photo and ring swap from `swap` to `swapEnd`, and the
// cursor leaves for the size at `leave`. `size` clicks the size chip,
// selecting it at `select`; the price changes from `price` to `priceEnd` and
// the cursor leaves for the button at `leave`. `add` presses the button, its
// spinner fading in from `load` to `loadEnd`. `fly` sends the product into
// the bag, fading in over `fadeIn`. `land` is the product reaching the bag:
// the button turns done from `done` to `doneEnd`, its check draws from
// `check` to `checkEnd`, the flying product fades from `out` to `outEnd`,
// and the bag bumps at `bump` as the badge pops. `drawer` slides the cart
// drawer in, its lines landing from `item` over `itemLen`, `stagger` apart,
// and the shipping bar filling from `ship` to `shipEnd`. `checkout` sends
// the cursor to Checkout, hovering it from `hover` to `hoverEnd`.
export const cartAddTimeline = defineTimeline<
  CartAddElementId,
  CartAddTimingProps
>((): TimelineElement<CartAddElementId>[] => [
  { id: "app", lane: "Store", label: "Window", start: 0, length: 12 },
  { id: "cursor", lane: "Cursor", label: "Cursor", start: 6, length: 8 },
  {
    id: "color",
    lane: "Cursor",
    label: "Pick color",
    start: 34,
    length: 26,
    follows: "cursor",
    beats: { swap: 1, swapEnd: 14, leave: 6 },
  },
  {
    id: "size",
    lane: "Cursor",
    label: "Pick size",
    start: 60,
    length: 24,
    follows: "color",
    beats: { select: 1, price: 2, priceEnd: 12, leave: 6 },
  },
  {
    id: "add",
    lane: "Cursor",
    label: "Add to bag",
    start: 84,
    length: 8,
    follows: "size",
    beats: { load: 2, loadEnd: 8 },
  },
  {
    id: "fly",
    lane: "Bag",
    label: "Fly to bag",
    start: 92,
    length: 22,
    follows: "add",
    beats: { fadeIn: 4 },
  },
  {
    id: "land",
    lane: "Bag",
    label: "Land",
    start: 114,
    length: 6,
    follows: "fly",
    beats: {
      done: -6,
      doneEnd: 2,
      check: -4,
      checkEnd: 6,
      out: -3,
      outEnd: 1,
      bump: 2,
    },
  },
  {
    id: "drawer",
    lane: "Drawer",
    label: "Cart drawer",
    start: 120,
    length: 40,
    follows: "land",
    beats: { item: 6, itemLen: 12, stagger: 3, ship: 16, shipEnd: 40 },
  },
  {
    id: "checkout",
    lane: "Cursor",
    label: "Checkout",
    start: 142,
    length: 24,
    follows: "drawer",
    beats: { hover: 18, hoverEnd: 24 },
  },
]);
