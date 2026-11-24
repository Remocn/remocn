import { defineTimeline } from "@/lib/remocn/timeline";

// When each logo springs into the stack. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type LogoEnterElementId = `logo:${number}`;

export interface LogoEnterTimingProps {
  logos?: readonly unknown[];
  stagger?: number;
}

/** How many logos the sample stack has, when `logos` is not given. */
const SAMPLE_COUNT = 4;
const STAGGER = 7;
/** Frames the spring takes to settle a logo in place. */
const SETTLE = 24;

// `logo:<i>` is the i-th logo; the list is a chain, `stagger` apart.
export const logoEnterTimeline = defineTimeline<
  LogoEnterElementId,
  LogoEnterTimingProps
>(({ logos, stagger = STAGGER }) =>
  Array.from({ length: logos?.length ?? SAMPLE_COUNT }, (_, i) => ({
    id: `logo:${i}` as const,
    lane: "Logos",
    label: `logo ${i + 1}`,
    start: i * stagger,
    length: SETTLE,
    follows: i > 0 ? (`logo:${i - 1}` as const) : undefined,
  })),
);
