import { defineTimeline } from "@/lib/remocn/timeline";

export type EcosystemConstellationElementId = `satellite:${number}`;

export interface EcosystemConstellationTimingProps {
  satelliteCount?: number;
}

/** The brands the satellites wear, in orbit order. */
const BRAND_NAMES = [
  "GitHub",
  "Vercel",
  "Stripe",
  "Slack",
  "Linear",
  "Figma",
  "Notion",
  "Discord",
];

const STAGGER = 4;
/** Frames a satellite's assembly spring takes to fly into orbit. */
const ASSEMBLE = 50;

/** Satellites drawn: 3 up to one per brand. */
export function constellationCount(satelliteCount: number) {
  return Math.max(3, Math.min(BRAND_NAMES.length, Math.floor(satelliteCount)));
}

// Each satellite flies in from off-screen onto its orbit, one after another.
// The orbiting, the center pulse and the data pulse cycling through the
// satellites run on the scene clock and are not elements.
export const ecosystemConstellationTimeline = defineTimeline<
  EcosystemConstellationElementId,
  EcosystemConstellationTimingProps
>(({ satelliteCount = 6 }) =>
  Array.from({ length: constellationCount(satelliteCount) }, (_, i) => ({
    id: `satellite:${i}` as const,
    lane: "Satellites",
    label: BRAND_NAMES[i],
    start: i * STAGGER,
    length: ASSEMBLE,
    follows: i > 0 ? (`satellite:${i - 1}` as const) : undefined,
  })),
);
