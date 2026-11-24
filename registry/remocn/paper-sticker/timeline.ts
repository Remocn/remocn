import { defineTimeline } from "@/lib/remocn/timeline";

// When the sticker slaps on. Frames on the 30 fps scene timeline; it lands
// at `at`. The ids are public: a saved `timing` prop refers to them.

export type PaperStickerElementId = "slap";

export interface PaperStickerTimingProps {
  at?: number;
  step?: number;
}

/** Frames one stop-motion step holds, as `DEFAULT_STEP` in `stop-motion`. */
const STEP = 3;

// `slap` pops the sticker in oversized and settles it over two steps.
export const paperStickerTimeline = defineTimeline<
  PaperStickerElementId,
  PaperStickerTimingProps
>(({ at = 0, step = STEP }) => [
  {
    id: "slap",
    lane: "Sticker",
    label: "slap",
    start: at,
    length: 2 * step,
  },
]);
