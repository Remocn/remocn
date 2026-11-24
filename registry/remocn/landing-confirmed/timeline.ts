import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Beat sheet (30fps, speed 1):
//   0–50    altitude counts down fast from 1,200 m; the gauge marker rides the
//           vertical scale down to the pad line; velocity bleeds off top right
//   50      0 m: hard stop with a kick, the pad line lights; holds 6 frames
//   56–57   two-frame "aurora" flash
//   58      TOUCHDOWN / CONFIRMED slams in; the aurora glows up from the pad
//   88–102  it shrinks up into a label; SHIPPED. slams, "Nailed the landing."
//           and the logo rise in under it
//   104–    poster hold
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type LandingConfirmedElementId =
  | "intro"
  | "descent"
  | "flash"
  | "slam"
  | "resolve"
  | "title"
  | "label"
  | "subtitle"
  | "logo";

export interface LandingConfirmedTimingProps {
  confirm?: string;
  title?: string;
  subtitle?: string;
  descent?: number;
}

export const DEFAULT_CONFIRM = "Touchdown confirmed";
export const DEFAULT_TITLE = "Shipped.";
export const DEFAULT_SUBTITLE = "Nailed the landing.";
const DESCENT = 50;

// `intro` fades the gauge and readout in. `descent` counts the altitude down
// to the pad; the readout kicks for `kick` frames when it stops. `flash` is
// the two-frame aurora flash; the readout leaves over `out`, the aurora
// glows up over `glow` and drifts over `drift`. `slam` slams the
// confirmation in over `in` from `lead`, kicks `hit` frames in for `hitLen`,
// and fades the gauge over `gaugeOut`; it holds until the resolve.
// `resolve` shrinks the confirmation up and away (`exit`); `title` slams in
// and kicks `hit` frames later, `label`, `subtitle` and `logo` rise in.
export const landingConfirmedTimeline = defineTimeline<
  LandingConfirmedElementId,
  LandingConfirmedTimingProps
>(
  ({
    confirm = DEFAULT_CONFIRM,
    title = DEFAULT_TITLE,
    subtitle = DEFAULT_SUBTITLE,
    descent = DESCENT,
  }): TimelineElement<LandingConfirmedElementId>[] => {
    const flashAt = descent + 6;
    const slamAt = flashAt + 2;
    const resolveAt = slamAt + 30;
    return [
      { id: "intro", lane: "Gauge", label: "intro", start: -4, length: 10 },
      {
        id: "descent",
        lane: "Gauge",
        label: "descent",
        start: 0,
        length: descent,
        beats: { kick: 7 },
      },
      {
        id: "flash",
        lane: "Aurora",
        label: "flash",
        start: flashAt,
        length: 2,
        follows: "descent",
        beats: { out: 1, glow: 18, drift: 120 },
      },
      {
        id: "slam",
        lane: "Headline",
        label: confirm,
        start: slamAt,
        length: resolveAt - slamAt,
        follows: "flash",
        beats: { lead: -1, in: 8, hit: 4, hitLen: 8, gaugeOut: 10 },
      },
      {
        id: "resolve",
        lane: "Headline",
        label: "resolve",
        start: resolveAt,
        length: 14,
        follows: "slam",
        beats: { exit: 6 },
      },
      {
        id: "title",
        lane: "Title",
        label: title,
        start: resolveAt + 5,
        length: 9,
        follows: "resolve",
        beats: { hit: 3, hitLen: 8 },
      },
      {
        id: "label",
        lane: "Label",
        label: confirm,
        start: resolveAt + 6,
        length: 10,
        follows: "resolve",
      },
      {
        id: "subtitle",
        lane: "Subtitle",
        label: subtitle,
        start: resolveAt + 9,
        length: 12,
        follows: "resolve",
      },
      {
        id: "logo",
        lane: "Logo",
        label: "logo",
        start: resolveAt + 14,
        length: 12,
        follows: "resolve",
      },
    ];
  },
);
