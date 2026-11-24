import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first row of product cards popping in close up, the camera pulling
// back to reveal the whole store admin, its chrome and sidebar fading in,
// the product count rolling up as the second row lands, then the publish
// button going live. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type GridToAppElementId =
  | `card:${number}`
  | "pull"
  | "chrome"
  | "sidebar"
  | "count"
  | "publish";

export interface GridToAppTimingProps {
  products?: readonly { name: string }[];
}

export const DEFAULT_PRODUCTS = [
  { name: "Ceramic pitcher", price: "$48.00" },
  { name: "Oak stool", price: "$120.00" },
  { name: "Arch sculpture", price: "$86.00" },
  { name: "Material kit", price: "$32.00" },
  { name: "Writing desk", price: "$640.00" },
  { name: "Oak dining table", price: "$1,180.00" },
  { name: "Travertine bench", price: "$420.00" },
  { name: "Olive planter", price: "$64.00" },
];

const ROW1 = [-8, -5, -2, 1];
const ROW2 = [50, 53, 56, 59];
const PULL = 14;
const PULL_LEN = 40;
const CHROME = 24;
const SIDE = 28;
const COUNT = 50;
const PUBLISH = 84;
const END = 132;
/** The most cards the grid shows: two rows of four, or three of two. */
const MAX_CARDS = 8;
/** Sidebar rows that slide in: nav, section heads and channels. */
const SIDE_ITEMS = 9;

// `card:<i>` pops product card i in on a spring and settles its photo over
// its length; each row of four is a chain. `pull` pulls the camera back over
// its length, tilting on a spring for `tilt` frames; before it the camera
// breathes in from `breathe` for `breatheLen`, after it it drifts in for
// `drift`. `chrome` fades the window chrome in. `sidebar` slides the sidebar
// rows in, `stagger` apart, each over `item`. `count` rolls the product
// count over `roll` and grows its bar over its length. `publish` dips the
// button at `dip` and turns it live with a pop at its start.
export const gridToAppTimeline = defineTimeline<
  GridToAppElementId,
  GridToAppTimingProps
>(({ products = DEFAULT_PRODUCTS }) => {
  const elements: TimelineElement<GridToAppElementId>[] = [];
  products.slice(0, MAX_CARDS).forEach((p, i) => {
    const firstRow = i < 4;
    elements.push({
      id: `card:${i}`,
      lane: firstRow ? "Row 1" : "Row 2",
      label: p.name,
      start: firstRow
        ? (ROW1[i] ?? 0)
        : (ROW2[(i - 4) % ROW2.length] ?? 50) +
          Math.floor((i - 4) / ROW2.length) * 6,
      length: 60,
      follows: i > 0 && i !== 4 ? `card:${i - 1}` : undefined,
    });
  });
  elements.push(
    {
      id: "pull",
      lane: "Camera",
      label: "Pull back",
      start: PULL,
      length: PULL_LEN,
      beats: {
        tilt: PULL_LEN + 10,
        breathe: -10 - PULL,
        breatheLen: PULL + 6,
        drift: END,
      },
    },
    {
      id: "chrome",
      lane: "Chrome",
      label: "Chrome",
      start: CHROME,
      length: 18,
    },
    {
      id: "sidebar",
      lane: "Chrome",
      label: "Sidebar",
      start: SIDE,
      length: 12 + (SIDE_ITEMS - 1) * 2,
      beats: { stagger: 2, item: 12 },
    },
    {
      id: "count",
      lane: "Count",
      label: "Count",
      start: COUNT,
      length: 18,
      beats: { roll: 12 },
    },
    {
      id: "publish",
      lane: "Publish",
      label: "Publish",
      start: PUBLISH,
      length: 16,
      beats: { dip: -4 },
    },
  );
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
