import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The calm tease rises in and types its dots, the crash zoom blows it past
// the camera, and the reveal slams in with its tagline under it. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type CrashZoomElementId = "tease" | "dots" | "crash" | "impact" | "tag";

export interface CrashZoomTimingProps {
  tease?: string;
  /** Frames of the tease before the crash zoom hits. */
  windup?: number;
}

const BEAT = {
  teaseIn: 0,
  dots: 9,
  dotGap: 6,
  crash: 36,
  crashLen: 6,
  impact: 42,
  tag: 54,
} as const;

// The crash ends on the impact. Inside it the tease fades from `fadeAt` over
// `fade` and the speed lines run in from `lines`. The impact flashes for
// `flash`; the slam and the lines easing back start after it.
export const crashZoomTimeline = defineTimeline<
  CrashZoomElementId,
  CrashZoomTimingProps
>(({ tease = "Wait for it…", windup = BEAT.crash }) => {
  const shift = windup - BEAT.crash;
  const elements: TimelineElement<CrashZoomElementId>[] = [
    {
      id: "tease",
      lane: "Tease",
      label: "tease",
      start: BEAT.teaseIn,
      length: 12,
    },
  ];
  if (tease.endsWith("…")) {
    elements.push({
      id: "dots",
      lane: "Tease",
      label: "…",
      start: BEAT.dots,
      length: 3 * BEAT.dotGap,
      beats: { gap: BEAT.dotGap },
    });
  }
  elements.push(
    {
      id: "crash",
      lane: "Tease",
      label: "crash zoom",
      start: BEAT.crash + shift,
      length: BEAT.crashLen,
      beats: { fadeAt: 3, fade: 3, lines: 1 },
    },
    {
      id: "impact",
      lane: "Reveal",
      label: "slam",
      start: BEAT.impact + shift,
      length: BEAT.tag - BEAT.impact,
      follows: "crash",
      beats: { flash: 1, shake: 12, lines: 20, bloom: 18, drift: 80 },
    },
    {
      id: "tag",
      lane: "Reveal",
      label: "tagline",
      start: BEAT.tag + shift,
      length: 12,
      follows: "impact",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
