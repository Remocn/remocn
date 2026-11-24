import { defineTimeline } from "@/lib/remocn/timeline";

// The intro of the synthwave loop: the sun rises over the horizon while the
// back range and then the front range slide in from the side. The grid,
// stars and sun stripes run on forever and are not elements. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SynthwaveElementId = "sun" | "back" | "front";

export const synthwaveTimeline = defineTimeline<SynthwaveElementId, object>(
  () => [
    { id: "sun", lane: "Sun", label: "sun rises", start: 0, length: 40 },
    {
      id: "back",
      lane: "Mountains",
      label: "back range",
      start: 4,
      length: 30,
    },
    {
      id: "front",
      lane: "Mountains",
      label: "front range",
      start: 8,
      length: 30,
    },
  ],
);
