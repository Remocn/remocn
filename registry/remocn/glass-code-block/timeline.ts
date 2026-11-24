import { defineTimeline } from "@/lib/remocn/timeline";

// When each line of code appears. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type GlassCodeBlockElementId = `line:${number}`;

export interface GlassCodeBlockTimingProps {
  code?: string;
  staggerFrames?: number;
}

export const DEFAULT_CODE = `import { motion } from "remotion";

// Generate a hero scene
export function Hero() {
  const frame = useCurrentFrame();
  const opacity = frame / 30;
  return <h1 style={{ opacity }}>Hello</h1>;
}`;

const STAGGER_FRAMES = 4;

// `line:<i>` mounts line `i` and runs until the next one, `staggerFrames`
// after the one before; a chain. The line's own fade-up is a fixed 8 frames
// of the composition clock, so `stretch` moves the lines after it.
export const glassCodeBlockTimeline = defineTimeline<
  GlassCodeBlockElementId,
  GlassCodeBlockTimingProps
>(({ code = DEFAULT_CODE, staggerFrames = STAGGER_FRAMES }) =>
  code.split("\n").map((line, i) => ({
    id: `line:${i}`,
    lane: "Lines",
    label: line,
    start: i * staggerFrames,
    length: staggerFrames,
    follows: i > 0 ? `line:${i - 1}` : undefined,
  })),
);
