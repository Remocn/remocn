import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The letter cuts hard from treatment to treatment, each cut a frame shorter
// every two, with a held breath before the final treatment lands and holds
// as the poster. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type DynamicLetterElementId = `cut:${number}` | "final";

export type DynamicLetterVariant =
  | "solid"
  | "outline"
  | "stripes"
  | "slice"
  | "stencil"
  | "dots"
  | "overflow"
  | "counter"
  | "shadow";

export interface DynamicLetterTimingProps {
  variants?: DynamicLetterVariant[];
  final?: DynamicLetterVariant;
  beat?: number;
  minBeat?: number;
}

export const DEFAULT_VARIANTS: DynamicLetterVariant[] = [
  "solid",
  "outline",
  "stripes",
  "slice",
  "stencil",
  "dots",
  "counter",
];
export const DEFAULT_FINAL: DynamicLetterVariant = "overflow";
const BEAT = 8;
const MIN_BEAT = 5;
/** The plain letter holds this long before the first cut. */
const FIRST_CUT = 8;
/** A treatment eases into its size over this many frames after it cuts in. */
const LAND = 9;

/** The treatments in the order they cut in, the final one last. */
export function dynamicLetterSequence(
  variants: DynamicLetterVariant[],
  final: DynamicLetterVariant,
) {
  return [...variants.filter((v) => v !== final), final];
}

// A cut holds until the next one; the final holds to the end of the scene.
export const dynamicLetterTimeline = defineTimeline<
  DynamicLetterElementId,
  DynamicLetterTimingProps
>(
  (
    {
      variants = DEFAULT_VARIANTS,
      final = DEFAULT_FINAL,
      beat = BEAT,
      minBeat = MIN_BEAT,
    },
    { length },
  ) => {
    const sequence = dynamicLetterSequence(variants, final);
    const count = sequence.length;
    const elements: TimelineElement<DynamicLetterElementId>[] = [];
    let f = FIRST_CUT;
    for (let i = 0; i < count; i++) {
      const step = Math.max(minBeat, beat - Math.floor(i / 2));
      // A held breath before the final treatment lands.
      const next = i === count - 2 ? step + 4 : step;
      const last = i === count - 1;
      elements.push({
        id: last ? "final" : `cut:${i}`,
        lane: "Treatments",
        label: sequence[i],
        start: f,
        length: last ? Math.max(0, length - f) : next,
        follows: i > 0 ? `cut:${i - 1}` : undefined,
        beats: { land: LAND },
      });
      f += next;
    }
    return elements;
  },
);
