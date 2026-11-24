import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A point of light igniting, writing the script, burning out as the whole
// exposure flashes in, then a bar of light sweeping the script into the
// logo. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type LightTrailWriteElementId = "ignite" | "write" | "reveal" | "sweep";

export interface LightTrailWriteTimingProps {
  write?: number;
}

const WRITE_START = 6;
const WRITE_END = 86;
/** Frames the light takes to write the path by default. */
const DEFAULT_WRITE = WRITE_END - WRITE_START;

// `ignite` lights the point up. `write` moves it along the path. `reveal`
// flashes the whole exposure in; the head burns out from `burnAt` (before its
// start) to its end, and the trail left behind fades over `trailFade`.
// `sweep` crosses the frame with the bar of light; the bloom fades from
// `bloomAt` to `bloomOut` frames past its end, the sheen drifts until `sheen`
// frames past its end. Each follows the one before.
export const lightTrailWriteTimeline = defineTimeline<
  LightTrailWriteElementId,
  LightTrailWriteTimingProps
>(({ write = DEFAULT_WRITE }) => {
  const writeEnd = WRITE_START + write;
  const sweepStart = writeEnd + 12;
  const elements: TimelineElement<LightTrailWriteElementId>[] = [
    { id: "ignite", lane: "Light", label: "Ignite", start: 0, length: 10 },
    {
      id: "write",
      lane: "Light",
      label: "Write",
      start: WRITE_START,
      length: write,
      follows: "ignite",
    },
    {
      id: "reveal",
      lane: "Light",
      label: "Burn out",
      start: writeEnd,
      length: 10,
      follows: "write",
      beats: { burnAt: -2, trailFade: 8 },
    },
    {
      id: "sweep",
      lane: "Logo",
      label: "Sweep to the logo",
      start: sweepStart,
      length: 24,
      follows: "reveal",
      beats: { bloomAt: 6, bloomOut: 14, sheen: 60 },
    },
  ];
  return elements;
});
