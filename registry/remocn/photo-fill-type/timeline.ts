import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word opening onto the image, the tracking widening while each letter
// fills from the baseline up (center letters first), the gutters closing
// into one band, the band opening to the full image under a slow push, and
// the caption. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type PhotoFillTypeElementId =
  | "open"
  | "track"
  | `fill:${number}`
  | "close"
  | "push"
  | "band"
  | "caption";

export interface PhotoFillTypeTimingProps {
  title?: string;
  /** Frame the letters start filling and the word opens to the full image. */
  expandAt?: number;
  /** Frames between letters filling, center letters first. */
  stagger?: number;
}

export const DEFAULT_TITLE = "Dusk";
export const EXPAND = 72;
const CAPTION = 118;
const STAGGER = 3;

/** The title as the letters the word is set in. */
export function lettersOf(title: string) {
  return title.toUpperCase().split("");
}

// `open` is the word fading and settling onto the image. `track` is the
// tracking widening; `fill:<i>` is letter `i` filling with image, the
// letters nearest the center first. `close` is the gutters closing into one
// band, `push` the image easing out of its push, `band` the band opening
// like a letterbox, and `caption` the caption landing.
export const photoFillTypeTimeline = defineTimeline<
  PhotoFillTypeElementId,
  PhotoFillTypeTimingProps
>(({ title = DEFAULT_TITLE, expandAt = EXPAND, stagger = STAGGER }) => {
  const letters = lettersOf(title);
  const n = Math.max(letters.length, 1);
  const mid = (n - 1) / 2;
  const out: TimelineElement<PhotoFillTypeElementId>[] = [
    { id: "open", lane: "Word", label: "open", start: 0, length: 22 },
    {
      id: "track",
      lane: "Word",
      label: "tracking",
      start: expandAt,
      length: 20,
    },
  ];
  for (let i = 0; i < n; i++) {
    const order = Math.floor(Math.abs(i - mid) + 0.01);
    out.push({
      id: `fill:${i}`,
      lane: "Letters",
      label: letters[i] ?? "",
      start: expandAt + 3 + order * stagger,
      length: 14,
    });
  }
  out.push(
    {
      id: "close",
      lane: "Word",
      label: "close",
      start: expandAt + 18,
      length: 12,
    },
    {
      id: "push",
      lane: "Image",
      label: "push",
      start: expandAt + 22,
      length: 42,
    },
    {
      id: "band",
      lane: "Image",
      label: "letterbox",
      start: expandAt + 26,
      length: 26,
    },
    {
      id: "caption",
      lane: "Caption",
      label: "caption",
      start: CAPTION + (expandAt - EXPAND),
      length: 18,
    },
  );
  return out.sort((a, b) => a.start - b.start);
});
