import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first line rising on both sides of a dot, the dot blooming into the
// disc with the mark, the first line parting as the disc grows, the second
// line sliding in and out, the disc dropping into the dot of a question mark
// whose hook draws on, and the last line rising; a slow push runs under all
// of it. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type GlyphRelayElementId =
  | "line1"
  | "push"
  | "dot"
  | "bloom"
  | "line1-out"
  | "grow"
  | "line2"
  | "line2-out"
  | "drop"
  | "hook"
  | "line3";

const B = {
  l1: -8,
  dot: 10,
  bloom: 20,
  l1out: 46,
  grow: 46,
  l2in: 52,
  l2out: 84,
  drop: 90,
  hook: 90,
  l3: 98,
  end: 146,
};

export const GLYPH_RELAY_END = B.end;

// The disc's steps (dot, bloom, grow, drop) form a chain, each running until
// the next. A line's halves or rows start `stagger` apart and `rise` frames
// each; an exit's `hide` beat is when the line leaves the tree, the second
// line's `show` beat when it joins it. The bloom's `tint` and `mark` beats
// colour the disc and bring the mark in; the hook fades in over `fade` and
// draws over `draw` from `drawAt`.
export const glyphRelayTimeline = defineTimeline<GlyphRelayElementId, object>(
  () => {
    const elements: TimelineElement<GlyphRelayElementId>[] = [
      {
        id: "line1",
        lane: "Lines",
        label: "first line",
        start: B.l1,
        length: 3 + 14,
        beats: { stagger: 3, rise: 14 },
      },
      {
        id: "push",
        lane: "Camera",
        label: "push in",
        start: 0,
        length: B.end,
      },
      {
        id: "dot",
        lane: "Disc",
        label: "dot",
        start: B.dot,
        length: B.bloom - B.dot,
      },
      {
        id: "bloom",
        lane: "Disc",
        label: "bloom",
        start: B.bloom,
        length: B.grow - B.bloom,
        follows: "dot",
        beats: { tint: 8, markAt: 3, mark: 10 },
      },
      {
        id: "line1-out",
        lane: "Lines",
        label: "first line parts",
        start: B.l1out,
        length: 10,
        beats: { hide: 12 },
      },
      {
        id: "grow",
        lane: "Disc",
        label: "grow",
        start: B.grow,
        length: B.drop - B.grow,
        follows: "bloom",
      },
      {
        id: "line2",
        lane: "Lines",
        label: "second line",
        start: B.l2in,
        length: B.l2out - B.l2in,
        beats: { show: -1 },
      },
      {
        id: "line2-out",
        lane: "Lines",
        label: "second line parts",
        start: B.l2out,
        length: 9,
        follows: "line2",
        beats: { hide: 11 },
      },
      {
        id: "drop",
        lane: "Disc",
        label: "drop",
        start: B.drop,
        length: 14,
        follows: "grow",
      },
      {
        id: "hook",
        lane: "Hook",
        label: "hook",
        start: B.hook,
        length: 2 + 22,
        beats: { fade: 6, drawAt: 2, draw: 22 },
      },
      {
        id: "line3",
        lane: "Lines",
        label: "last line",
        start: B.l3,
        length: 14,
        beats: { stagger: 4, rise: 14 },
      },
    ];
    return elements;
  },
);
