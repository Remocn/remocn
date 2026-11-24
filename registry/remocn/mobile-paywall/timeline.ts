import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rising in with the paywall sheet, then the finger picking a plan
// and tapping the CTA, the payment sheet with its double-click on the side
// button, the check, the sheet leaving and the welcome screen. The copy lines
// beside the phone change with the beats. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type MobilePaywallElementId =
  | "phone"
  | "camera"
  | "sheet"
  | `line:${number}`
  | "reach"
  | "plan"
  | "cta"
  | "pay"
  | "dc1"
  | "dc2"
  | "check"
  | "dismiss"
  | "welcome";

const SHEET_AT = 4;
const TAP_IN = 50;
const TAP1 = 66;
const TAP2 = 100;
const PAY_AT = 108;
const DC1 = 138;
const DC2 = 146;
const CHECK_AT = 156;
const DISMISS = 180;
const WELCOME = 186;

// `phone` rises the phone in. `camera` is the slow push across the clip.
// `sheet` slides the paywall up: the hero pops at `heroAt`, the title fades
// in from `titleAt` over `title`, the features rise from `featuresAt`,
// `feature` apart, the plans from `plansAt`, `plan` apart, and the CTA at
// `ctaAt`. `line:<i>` brings copy line `i` in over `rise` and out from
// `outLead` before its end to `out` after it (a chain). On the finger's
// lane, each press lets go after `release`: `reach` brings the finger in
// (fading over `fadeIn`); `plan` taps the first plan (arriving at
// `arriveAt`, drifting until `driftEnd`, selecting at `selectAt`); `cta`
// taps the button (the finger fades from `fadeAt` to `fadeEnd`). `pay`
// slides the payment sheet up; its side-button hint comes in at `hintAt`.
// `dc1` and `dc2` are the double-click; after the second the hint fades over
// `hintOut` and processing starts at `processAt`. `check` draws the check.
// `dismiss` fades the sheets out over its length while they drop over
// `away`. `welcome` shows the welcome screen (from `showAt`): the badge pops
// at `badgeAt`, the title and subtitle fade in from `titleAt` and `subAt`
// over `text`, the rows rise from `rowsAt`, `row` apart, the rail draws from
// `railAt` to `railEnd` and the button comes in at `ctaAt`. Each step
// follows the one before.
export const mobilePaywallTimeline = defineTimeline<
  MobilePaywallElementId,
  object
>(() => {
  const beats = [0, PAY_AT, WELCOME];
  const lineAt = beats.map((at, i) => at + (i === 0 ? 8 : 0));
  const elements: TimelineElement<MobilePaywallElementId>[] = [
    { id: "phone", lane: "Phone", label: "Phone", start: 0, length: SHEET_AT },
    { id: "camera", lane: "Camera", label: "Push-in", start: 0, length: 250 },
    {
      id: "sheet",
      lane: "Phone",
      label: "Paywall",
      start: SHEET_AT,
      length: 28,
      follows: "phone",
      beats: {
        heroAt: 6,
        titleAt: 8,
        title: 14,
        featuresAt: 12,
        feature: 3,
        plansAt: 22,
        plan: 3,
        ctaAt: 28,
      },
    },
    {
      id: "reach",
      lane: "Finger",
      label: "Reach",
      start: TAP_IN,
      length: TAP1 - 1 - TAP_IN,
      beats: { fadeIn: 6 },
    },
    {
      id: "plan",
      lane: "Finger",
      label: "Pick a plan",
      start: TAP1,
      length: TAP2 - TAP1,
      follows: "reach",
      beats: { arriveAt: -1, driftEnd: 10, selectAt: 1, release: 4 },
    },
    {
      id: "cta",
      lane: "Finger",
      label: "Tap the CTA",
      start: TAP2,
      length: PAY_AT - TAP2,
      follows: "plan",
      beats: { arriveAt: -1, release: 4, fadeAt: 6, fadeEnd: 11 },
    },
    {
      id: "pay",
      lane: "Payment",
      label: "Payment sheet",
      start: PAY_AT,
      length: DC1 - PAY_AT,
      follows: "cta",
      beats: { hintAt: 8 },
    },
    {
      id: "dc1",
      lane: "Payment",
      label: "Side button",
      start: DC1,
      length: DC2 - DC1,
      follows: "pay",
      beats: { release: 4 },
    },
    {
      id: "dc2",
      lane: "Payment",
      label: "Side button again",
      start: DC2,
      length: CHECK_AT - DC2,
      follows: "dc1",
      beats: { release: 4, processAt: 2, hintOut: 5 },
    },
    {
      id: "check",
      lane: "Payment",
      label: "Check",
      start: CHECK_AT,
      length: 14,
      follows: "dc2",
    },
    {
      id: "dismiss",
      lane: "Payment",
      label: "Dismiss",
      start: DISMISS,
      length: 8,
      follows: "check",
      beats: { away: 14 },
    },
    {
      id: "welcome",
      lane: "Phone",
      label: "Welcome",
      start: WELCOME,
      length: 30,
      follows: "dismiss",
      beats: {
        showAt: -2,
        badgeAt: 8,
        titleAt: 4,
        subAt: 7,
        text: 14,
        rowsAt: 10,
        row: 4,
        railAt: 12,
        railEnd: 30,
        ctaAt: 16,
      },
    },
  ];
  lineAt.forEach((at, i) => {
    const next = lineAt[i + 1];
    elements.push({
      id: `line:${i}`,
      lane: "Copy",
      label: `Line ${i + 1}`,
      start: at,
      length: next === undefined ? 14 : next - at,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: { rise: 14, outLead: 2, out: 6 },
    });
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
