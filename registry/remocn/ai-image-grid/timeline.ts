import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The image generator: the prompt card rises and the prompt types in, the
// cursor clicks send and the card docks, the tiles start generating one
// after another and diffuse into images, then the cursor picks one and it
// zooms into a detail view. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type AiImageGridElementId =
  | "camera"
  | "card"
  | "prompt"
  | "cursor"
  | "send"
  | `tile:${number}`
  | "pick"
  | "details";

export interface AiImageGridTimingProps {
  prompt?: string;
  layout?: "2x2" | "3x2";
  /** Frames between tiles as they start generating. */
  stagger?: number;
}

export const DEFAULT_PROMPT = "isometric glass city at sunrise, soft light";
export const STAGGER = 3;
/** Characters the prompt types per frame. */
export const CHARS_PER_FRAME = 1.2;
const TYPE_START = 10;
const GEN = 60;
const DIFFUSE = [46, 58, 40, 64, 52, 44];

export const tileCountOf = (layout: "2x2" | "3x2") =>
  layout === "3x2" ? 6 : 4;

// The prompt types at `CHARS_PER_FRAME` divided by its `pace` beat, so a
// stretch slows the typing. `send` is the click on the send button: the
// card docks `dockAt` after it and the cursor's waypoints sit on its beats.
// A tile fades in over `appear`, then diffuses from `appear` over `diffuse`.
// `pick` clicks the chosen tile: it lifts on hover from `hoverAt`, the rest
// fade out and it zooms from `zoomAt` over `zoom`; `details` rise beside it.
export const aiImageGridTimeline = defineTimeline<
  AiImageGridElementId,
  AiImageGridTimingProps
>(
  ({
    prompt = DEFAULT_PROMPT,
    layout = "2x2",
    stagger = STAGGER,
  }): TimelineElement<AiImageGridElementId>[] => {
    const count = tileCountOf(layout);
    const ends = Array.from(
      { length: count },
      (_, i) => i * stagger + 6 + DIFFUSE[i % DIFFUSE.length],
    );
    const resolved = Math.max(...ends);
    const last = ends.indexOf(resolved);
    const PICK = GEN + 6 + resolved + 20;
    const elements: TimelineElement<AiImageGridElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "slow push",
        start: 0,
        length: 240,
      },
      {
        id: "card",
        lane: "Card",
        label: "prompt card",
        start: 0,
        length: 10,
      },
      {
        id: "prompt",
        lane: "Typing",
        label: prompt,
        start: TYPE_START,
        length: prompt.length / CHARS_PER_FRAME,
        follows: "card",
        beats: { pace: 1 },
      },
      {
        id: "cursor",
        lane: "Cursor",
        label: "cursor in",
        start: 24,
        length: 8,
        beats: { keyAt: 2 },
      },
      {
        id: "send",
        lane: "Cursor",
        label: "send",
        start: GEN,
        length: 6,
        follows: "cursor",
        beats: { arriveAt: -3, dockAt: 2, leaveAt: 8, awayAt: 34 },
      },
    ];
    for (let i = 0; i < count; i++) {
      elements.push({
        id: `tile:${i}`,
        lane: "Tiles",
        label: `image ${i + 1}`,
        start: GEN + 6 + i * stagger,
        length: 6 + DIFFUSE[i % DIFFUSE.length],
        follows: i > 0 ? `tile:${i - 1}` : "send",
        beats: { appear: 6, diffuse: DIFFUSE[i % DIFFUSE.length] },
      });
    }
    elements.push(
      {
        id: "pick",
        lane: "Cursor",
        label: "pick",
        start: PICK,
        length: 28,
        follows: `tile:${last}`,
        beats: {
          waitAt: -30,
          arriveAt: -4,
          hoverAt: -8,
          cardOut: 10,
          cursorOutAt: 4,
          cursorOut: 8,
          othersAt: 2,
          others: 9,
          zoomAt: 2,
          zoom: 26,
        },
      },
      {
        id: "details",
        lane: "Details",
        label: "details",
        start: PICK + 10,
        length: 16,
        follows: "pick",
        beats: { metaAt: 4, actionsAt: 8 },
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
