import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One scroll sliding the lines in at their parallax rates until the block
// locks, the slow push around the lock, and the accent line taking its
// gradient. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type ParallaxLockupElementId = "scroll" | "push" | "accent";

export interface ParallaxLockupTimingProps {
  lockAt?: number;
}

/** Frame the scroll lands and the block locks, by default. */
export const SCROLL_END = 94;
/** The push starts `PUSH_LEAD` before the lock and runs `PUSH_TAIL` past it. */
const PUSH_LEAD = 30;
const PUSH_TAIL = 56;
const ACCENT_AT = 80;
const ACCENT_END = 98;

// The push and the accent follow the scroll: they hang off the lock.
export const parallaxLockupTimeline = defineTimeline<
  ParallaxLockupElementId,
  ParallaxLockupTimingProps
>(({ lockAt = SCROLL_END }) => {
  const accentAt = lockAt - (SCROLL_END - ACCENT_AT);
  const accentEnd = lockAt + (ACCENT_END - SCROLL_END);
  const pushAt = lockAt - PUSH_LEAD;
  const elements: TimelineElement<ParallaxLockupElementId>[] = [
    { id: "scroll", lane: "Scroll", label: "scroll", start: 0, length: lockAt },
    {
      id: "push",
      lane: "Push",
      label: "push",
      start: pushAt,
      length: lockAt + PUSH_TAIL - pushAt,
      follows: "scroll",
    },
    {
      id: "accent",
      lane: "Accent",
      label: "gradient",
      start: accentAt,
      length: accentEnd - accentAt,
      follows: "scroll",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
