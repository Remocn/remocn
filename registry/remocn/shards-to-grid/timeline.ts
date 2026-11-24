import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

export type ShardsToGridElementId =
  | "pill"
  | "shards"
  | "push"
  | "morph"
  | "converge"
  | "snap"
  | "content";

// The shards fly in and swirl while the status pill counts up; the pill
// opens into the window (morph), the shards converge into its cells, the
// grid snaps with a punch and the cell content types in. Each shard keeps
// its own seeded offset from the start of `shards` (flying in) and
// `converge` (landing), so the shards move as a group.
export const shardsToGridTimeline = defineTimeline<
  ShardsToGridElementId,
  object
>((): TimelineElement<ShardsToGridElementId>[] => [
  {
    id: "pill",
    lane: "App",
    label: "Pill counts up",
    start: 0,
    length: 60,
    // The pill's spring starts this many frames before the scene.
    beats: { lead: -8 },
  },
  {
    id: "shards",
    lane: "Shards",
    label: "Shards fly in and swirl",
    start: 0,
    length: 66,
  },
  { id: "push", lane: "Camera", label: "Push in", start: 0, length: 144 },
  {
    id: "morph",
    lane: "App",
    label: "Pill opens into the app",
    start: 60,
    length: 24,
    follows: "pill",
    // The pill text fades over 5 frames; the window chrome types in from
    // frame 10 to 22.
    beats: { textOut: 5, chrome: 10, chromeEnd: 22 },
  },
  {
    id: "converge",
    lane: "Shards",
    label: "Shards converge into cells",
    start: 62,
    length: 22,
    follows: "morph",
  },
  {
    id: "snap",
    lane: "Grid",
    label: "Grid snaps",
    start: 84,
    length: 10,
    follows: "converge",
    // The punch peaks at 2; the call to action pops at 6.
    beats: { peak: 2, cta: 6 },
  },
  {
    id: "content",
    lane: "Content",
    label: "Cell content",
    start: 84,
    length: 28,
    follows: "converge",
    // Cells come in 3 frames apart, headline words 2 apart over 13 frames,
    // the play chip at 9, captions from 4 to 16 frames into their cell.
    beats: {
      stagger: 3,
      word: 2,
      wordRise: 13,
      play: 9,
      caption: 4,
      captionEnd: 16,
    },
  },
]);
