import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A light ignites under the name, chases out to the edges lighting each
// letter as it passes, then runs back in and settles the line; the eyebrow
// and the tagline come in on the return. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type LightSignatureElementId =
  | "settle"
  | "chase"
  | "return"
  | "eyebrow"
  | "tagline";

export interface LightSignatureTimingProps {
  /** Frames for the light to run from the center out to the edges. */
  sweep?: number;
}

const CHASE_START = 12;
const CHASE_LEN = 40;
const RETURN_START = 50;
const RETURN_LEN = 26;

// The chase runs over `sweep`; the line ignites `igniteAt` before it and a
// letter fills and flashes from the moment the light reaches it. The return
// sweeps back in, each segment merging over `merge` once passed, and the
// name pulses at `pulseAt`. The whole lockup settles its scale from frame 0.
export const lightSignatureTimeline = defineTimeline<
  LightSignatureElementId,
  LightSignatureTimingProps
>(({ sweep = CHASE_LEN }): TimelineElement<LightSignatureElementId>[] => {
  const shift = sweep - CHASE_LEN;
  return [
    {
      id: "settle",
      lane: "Lockup",
      label: "settle",
      start: 0,
      length: 110,
    },
    {
      id: "chase",
      lane: "Light",
      label: "chase out",
      start: CHASE_START,
      length: sweep,
      beats: {
        igniteAt: -4,
        ignite: 6,
        hold: 10,
        fade: 6,
        letterLead: -1,
        letterFill: 6,
        flashPeak: 4,
        flashOut: 18,
      },
    },
    {
      id: "return",
      lane: "Light",
      label: "return",
      start: RETURN_START + shift,
      length: RETURN_LEN,
      follows: "chase",
      beats: {
        merge: 9,
        pulseAt: RETURN_LEN * 0.8,
        pulsePeak: 4,
        pulseOut: 16,
      },
    },
    {
      id: "eyebrow",
      lane: "Eyebrow",
      label: "eyebrow",
      start: 58 + shift,
      length: 24,
      follows: "return",
    },
    {
      id: "tagline",
      lane: "Tagline",
      label: "tagline",
      start: 64 + shift,
      length: 26,
      follows: "return",
    },
  ];
});
