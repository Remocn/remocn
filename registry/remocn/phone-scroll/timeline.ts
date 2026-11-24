import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rises and levels, the headline slides in beside it, then a
// finger flicks the screen once per stop while the camera pushes in slowly.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type PhoneScrollElementId =
  | "camera"
  | "phone"
  | "eyebrow"
  | "headline"
  | `flick:${number}`;

export interface PhoneScrollTimingProps {
  /** Scroll offsets (screen points) to flick to, one flick per stop. */
  stops?: number[];
  /** Frames from one flick to the next when there are several stops. */
  flickGap?: number;
}

export const DEFAULT_STOPS = [930];
export const SEG = 46;
const FLICK_START = 40;
const PRESS = 5;
const DRAG = 6;
const TAU = 10;

// A flick runs until the next one. The finger presses for `press`, drags
// for `drag`, and the screen glides on with time constant `tau`; the touch
// dot shows from `lead` before the flick, fades in over `dotIn` and out over
// `dotOut` once the drag ends. The headline's accent rises `accentAt` after
// it.
export const phoneScrollTimeline = defineTimeline<
  PhoneScrollElementId,
  PhoneScrollTimingProps
>(
  ({
    stops = DEFAULT_STOPS,
    flickGap = SEG,
  }): TimelineElement<PhoneScrollElementId>[] => {
    const elements: TimelineElement<PhoneScrollElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "slow push",
        start: 0,
        length: 120,
      },
      {
        id: "phone",
        lane: "Phone",
        label: "phone rises",
        start: 0,
        length: 20,
        beats: { levelAt: 6 },
      },
      { id: "eyebrow", lane: "Copy", label: "eyebrow", start: 12, length: 14 },
      {
        id: "headline",
        lane: "Copy",
        label: "headline",
        start: 16,
        length: 16,
        follows: "eyebrow",
        beats: { accentAt: 6 },
      },
    ];
    stops.forEach((stop, i) => {
      elements.push({
        id: `flick:${i}`,
        lane: "Flicks",
        label: `flick to ${stop}`,
        start: FLICK_START + i * flickGap,
        length: flickGap,
        follows: i > 0 ? `flick:${i - 1}` : undefined,
        beats: {
          press: PRESS,
          drag: DRAG,
          tau: TAU,
          lead: 4,
          dotIn: 4,
          dotOut: 6,
        },
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
