import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The moons spiral into the core, the core bursts into a ring of light and
// the lockup pops in. Frames on the 30 fps scene timeline, after `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type OrbitLockElementId = "orbit" | "impact" | "lockup";

const IMPACT = 30;

// `orbit` spirals the moons in over its length: they and the core fade in
// over `fade`, the orbit lines trace in over `trace`. `impact` flashes the
// core from `flashAt` to `flashEnd`, bursts it up to `peak` and away by
// `burst`, fades the orbit lines from `orbitsOut`, and spreads the ring over
// its length. `lockup` springs the lockup in, fading it over `fade`.
export const orbitLockTimeline = defineTimeline<OrbitLockElementId, object>(
  (): TimelineElement<OrbitLockElementId>[] => [
    {
      id: "orbit",
      lane: "Moons",
      label: "Spiral in",
      start: 0,
      length: IMPACT,
      beats: { fade: 5, trace: 6 },
    },
    {
      id: "impact",
      lane: "Core",
      label: "Impact",
      start: IMPACT,
      length: 16,
      follows: "orbit",
      beats: { flashAt: -2, flashEnd: 1, peak: 2, burst: 6, orbitsOut: -4 },
    },
    {
      id: "lockup",
      lane: "Lockup",
      label: "Lockup",
      start: IMPACT + 3,
      length: 12,
      follows: "impact",
      beats: { fade: 3 },
    },
  ],
);
