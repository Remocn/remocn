import { defineTimeline } from "@/lib/remocn/timeline";

// When each letter is written in. Frames on the 30 fps scene timeline,
// after `delay`, on the stop-motion grid: a letter lands on a pose, every
// `step` frames, `perStep` letters a pose. The ids are public: a saved
// `timing` prop refers to them.

export type HandwriteElementId = `char:${number}`;

export interface HandwriteTimingProps {
  text: string;
  perStep?: number;
  step?: number;
}

export const PER_STEP = 1.6;
/** Same as `DEFAULT_STEP` in stop-motion; kept here so the schedule imports nothing else. */
export const STEP = 3;

/** The first pose at which `floor(pose * perStep)` letters cover letter `j`. */
function poseOf(j: number, perStep: number) {
  let pose = Math.max(0, Math.ceil((j + 1) / perStep) - 1);
  while (Math.floor(pose * perStep) <= j) pose++;
  while (pose > 0 && Math.floor((pose - 1) * perStep) > j) pose--;
  return pose;
}

// `char:<i>` lands on its pose and stays fresh (drawn a touch larger) until
// the `ceil(perStep)` letters after it have landed too. With no letters a
// pose nothing is ever written, so there are no elements.
export const handwriteTimeline = defineTimeline<
  HandwriteElementId,
  HandwriteTimingProps
>(({ text, perStep = PER_STEP, step = STEP }) => {
  if (!(perStep > 0)) return [];
  const fresh = Math.ceil(perStep);
  return Array.from(text).map((char, i) => {
    const pose = poseOf(i, perStep);
    return {
      id: `char:${i}`,
      lane: "Letters",
      label: char,
      start: pose * step,
      length: (poseOf(i + fresh, perStep) - pose) * step,
      follows: i > 0 ? `char:${i - 1}` : undefined,
    };
  });
});
