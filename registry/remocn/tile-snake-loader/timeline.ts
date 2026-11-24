import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The loader: the name rises and breaks apart letter by letter as a snake
// of tiles starts circling it, the loading label scrambles in and the snake
// grows with the progress, then it retracts, the label gives way to a
// skeleton bar that grows into the app window and its content rises in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type TileSnakeLoaderElementId =
  | "name"
  | "break"
  | "snake"
  | "label"
  | "retract"
  | "skeleton"
  | "grow"
  | "app"
  | "content";

export interface TileSnakeLoaderTimingProps {
  name?: string;
}

export const DEFAULT_NAME = "Lumen Studio";

const B = {
  name: -10,
  breakAt: 6,
  letterStep: 1.4,
  snake: 6,
  label: 26,
  pctKeys: [24, 48, 70, 92, 108],
  full: 108,
  retract: 16,
  skeleton: 110,
  grow: 118,
  app: 130,
  content: 131,
  end: 178,
};

/** Length of the demo the scene is cut for. */
export const SCENE_END = B.end;
/** Frames a letter of the name takes to break away. */
const LETTER = 7;
/** The last content step that rises in the window. */
const LAST_STEP = 6 + 3 * 0.6;

// `snake` runs from the first tile to the snake at full length: its head
// eases in over `intro` and the progress passes its keys `key0`…`key4`.
// `break` lets the letters go `letterStep` apart over `letter` each. The
// label fades in over its length and unscrambles from `settleAt` to
// `settleEnd`. Window content rises `step` apart over `rise` each; the
// camera pushes over `push`.
export const tileSnakeLoaderTimeline = defineTimeline<
  TileSnakeLoaderElementId,
  TileSnakeLoaderTimingProps
>(({ name = DEFAULT_NAME }): TimelineElement<TileSnakeLoaderElementId>[] => {
  const letters = Array.from(name).length;
  const keys = B.pctKeys.map((k) => k - B.snake);
  return [
    { id: "name", lane: "Name", label: name, start: B.name, length: 14 },
    {
      id: "break",
      lane: "Name",
      label: "letters break",
      start: B.breakAt,
      length: Math.max(0, letters - 1) * B.letterStep + LETTER,
      beats: { letterStep: B.letterStep, letter: LETTER },
    },
    {
      id: "snake",
      lane: "Snake",
      label: "tile snake",
      start: B.snake,
      length: B.full - B.snake,
      beats: {
        intro: 18,
        key0: keys[0],
        key1: keys[1],
        key2: keys[2],
        key3: keys[3],
        key4: keys[4],
      },
    },
    {
      id: "label",
      lane: "Label",
      label: "loading label",
      start: B.label - 4,
      length: 10,
      beats: { settleAt: 4, settleEnd: 18 },
    },
    {
      id: "retract",
      lane: "Snake",
      label: "retract",
      start: B.full,
      length: B.retract,
      follows: "snake",
    },
    {
      id: "skeleton",
      lane: "Label",
      label: "skeleton",
      start: B.skeleton,
      length: 8,
      follows: "retract",
      beats: { inAt: 2, in: 6 },
    },
    {
      id: "grow",
      lane: "Window",
      label: "grow",
      start: B.grow,
      length: 16,
      follows: "skeleton",
    },
    {
      id: "app",
      lane: "Window",
      label: "app",
      start: B.app,
      length: 8,
      follows: "grow",
    },
    {
      id: "content",
      lane: "Content",
      label: "content",
      start: B.content,
      length: LAST_STEP * 3 + 13,
      follows: "app",
      beats: { step: 3, rise: 13, cardAt: 4, push: B.end - B.content },
    },
  ];
});
