import { defineTimeline } from "@/lib/remocn/timeline";

// When each image blooms open over the last. Frames on the 30 fps scene
// timeline. The ids are public: a saved `timing` prop refers to them.

export type ReelElementId = `image:${number}`;

export interface ReelTimingProps {
  images?: string[];
  step?: number;
  reveal?: number;
}

/** The docs example's images, for a schedule read without the props. */
const EXAMPLE_IMAGES = ["shot-1.png", "shot-2.png", "shot-3.png"];
const STEP = 20;
const REVEAL = 13;

// Each image is an element (its reveal) that follows the one before it.
export const reelTimeline = defineTimeline<ReelElementId, ReelTimingProps>(
  ({ images = EXAMPLE_IMAGES, step = STEP, reveal = REVEAL }) =>
    images.map((src, i) => ({
      id: `image:${i}`,
      lane: "Images",
      label: src.split("/").pop() || `Image ${i + 1}`,
      start: i * step,
      length: reveal,
      follows: i > 0 ? `image:${i - 1}` : undefined,
    })),
);
