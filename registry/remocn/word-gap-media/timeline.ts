import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The words on both sides of the gap rising in, the card opening between
// them, each next image wiping over the one before, and the settle that
// arms the play button. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type WordGapMediaElementId =
  | `word:${number}`
  | "open"
  | `image:${number}`
  | "settle";

export interface WordGapMediaTimingProps {
  before?: string;
  after?: string;
  images?: string[];
  captions?: string[];
  stagger?: number;
}

export const DEFAULT_IMAGES = [
  "templates/product-showcase/sculpture.jpg",
  "templates/product-showcase/gallery.jpg",
  "templates/product-showcase/workbench.jpg",
  "templates/product-showcase/courtyard.jpg",
];
export const DEFAULT_CAPTIONS = ["Hero", "Gallery", "Detail", "Setting"];

export const WORD_STEP = 3;
const ENTER = 12;
const OPEN = 24;
const DWELL = [36, 30, 24];
const SWAP_LEN = 12;
const SETTLE_AFTER = 18;

/** The images the card shows: the first four, or the defaults when empty. */
export function imagesOf(images: string[]) {
  return (images.length > 0 ? images : DEFAULT_IMAGES).slice(0, 4);
}

// `word:<k>` counts the words of `before` and then of `after`, one chain.
// `open` springs the card open; its beats time the progress bars, the first
// caption, the button and the first image's slow zoom (`life`). `image:<i>`
// (from the second image) wipes in over `length` and morphs the card's
// aspect over `morph`; `caption` and `captionIn` bring its caption,
// `outgoing` takes the previous caption out. `settle` punches the card and
// arms the button (`armed`), flashing the border over `hit` and `length`.
export const wordGapMediaTimeline = defineTimeline<
  WordGapMediaElementId,
  WordGapMediaTimingProps
>(
  ({
    before = "Launch all",
    after = "of this",
    images = DEFAULT_IMAGES,
    captions = DEFAULT_CAPTIONS,
    stagger = WORD_STEP,
  }) => {
    const beforeWords = before.split(" ").filter(Boolean);
    const afterWords = after.split(" ").filter(Boolean);
    const afterStart = beforeWords.length * stagger;
    const words = [
      ...beforeWords.map((w, i) => ({ w, at: 0 + i * stagger - 4 })),
      ...afterWords.map((w, i) => ({ w, at: afterStart + i * stagger - 4 })),
    ];
    const n = imagesOf(images).length;
    const swapAt: number[] = [OPEN];
    for (let i = 1; i < n; i++) {
      swapAt.push(swapAt[i - 1] + DWELL[Math.min(i - 1, DWELL.length - 1)]);
    }
    const settleAt = n > 1 ? swapAt[n - 1] + SETTLE_AFTER : OPEN + SETTLE_AFTER;
    const captionOf = (i: number) =>
      captions[i % Math.max(1, captions.length)] ?? "";

    const elements: TimelineElement<WordGapMediaElementId>[] = [
      ...words.map(
        ({ w, at }, k): TimelineElement<WordGapMediaElementId> => ({
          id: `word:${k}`,
          lane: "Words",
          label: w,
          start: at,
          length: ENTER,
          follows: k > 0 ? `word:${k - 1}` : undefined,
        }),
      ),
      {
        id: "open",
        lane: "Card",
        label: captionOf(0),
        start: OPEN,
        length: 18,
        beats: {
          bars: 6,
          barsIn: 12,
          caption: 9,
          captionIn: 12,
          button: 12,
          life: 60,
        },
      },
      ...swapAt.slice(1).map(
        (at, j): TimelineElement<WordGapMediaElementId> => ({
          id: `image:${j + 1}`,
          lane: "Card",
          label: captionOf(j + 1),
          start: at,
          length: SWAP_LEN,
          follows: j > 0 ? `image:${j}` : "open",
          beats: {
            morph: 16,
            life: 60,
            caption: 4,
            captionIn: 12,
            outgoing: 8,
          },
        }),
      ),
      {
        id: "settle",
        lane: "Card",
        label: "Settle",
        start: settleAt,
        length: 20,
        follows: n > 1 ? `image:${n - 1}` : "open",
        beats: { hit: 4, armed: 6 },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
