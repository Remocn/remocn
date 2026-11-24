import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The build breathes in and rises like a riser, cuts to black for a beat of
// silence with one flash frame at its end, then the title (or the logo)
// hits and holds on a slow push while the line cuts back in under it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type BassDropElementId = "build" | "silence" | "hit" | "line";

export interface BassDropTimingProps {
  build?: string;
  title?: string;
  line?: string;
  buildLength?: number;
}

export const DEFAULT_BUILD = "THIS FALL";
export const CUT = 66;
const FLASH = 73;
const HIT = 74;
const LINE_AT = 96;
/** Frames the demo needs: the hit plus a long poster hold. */
export const BASS_DROP_LENGTH = 150;

// The build fades in over `breathe`–`breatheEnd` (it starts before the first
// frame) and its rule grows from `rule` to the cut. The silence flashes at
// `flash`. The hit punches over `punch`, then pushes until the demo's end.
// The line cuts in and holds.
export const bassDropTimeline = defineTimeline<
  BassDropElementId,
  BassDropTimingProps
>(({ build = DEFAULT_BUILD, title, line, buildLength = CUT }) => {
  const hit = buildLength + HIT - CUT;
  const lineAt = hit + LINE_AT - HIT;
  const elements: TimelineElement<BassDropElementId>[] = [
    {
      id: "build",
      lane: "Build",
      label: build,
      start: 0,
      length: buildLength,
      beats: { breathe: -8, breatheEnd: 40, rule: 10 },
    },
    {
      id: "silence",
      lane: "Build",
      label: "Silence",
      start: buildLength,
      length: hit - buildLength,
      follows: "build",
      beats: { flash: FLASH - CUT },
    },
    {
      id: "hit",
      lane: "Hit",
      label: title || "Logo",
      start: hit,
      length: BASS_DROP_LENGTH - hit,
      follows: "silence",
      beats: { punch: 2 },
    },
    {
      id: "line",
      lane: "Line",
      label: (line ?? build) || "Line",
      start: lineAt,
      length: BASS_DROP_LENGTH - lineAt,
      follows: "silence",
    },
  ];
  return elements;
});
