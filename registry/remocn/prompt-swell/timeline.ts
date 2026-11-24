import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A prompt swelling into a built page: the prompt card settles in, the
// prompt types, the send button arms and is pressed, the card swells into a
// browser window while the camera pulls back, the hero builds, the build
// steps tick off as the page scrolls to pricing (its plans rising) and the
// waitlist, then it is published and a toast confirms. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type PromptSwellElementId =
  | "card"
  | "type"
  | "armed"
  | "pull"
  | "press"
  | "swell"
  | "chrome"
  | "drift"
  | "hero"
  | `tick:${number}`
  | `scroll:${number}`
  | `plan:${number}`
  | "publish"
  | "toast";

export interface PromptSwellTimingProps {
  tiers?: { name: string }[];
}

export const DEFAULT_TIERS: { name: string; price: string }[] = [
  { name: "Free", price: "$0" },
  { name: "Pro", price: "$19" },
  { name: "Team", price: "$49" },
];

// The card settles in before the first frame: frame 0 already moves.
const B = {
  card: -10,
  type: 0,
  armed: 30,
  press: 36,
  swell: 40,
  chrome: 48,
  hero: 52,
  tick1: 66,
  scroll1: 72,
  plans: 76,
  tick2: 90,
  scroll2: 96,
  tick3: 104,
  publish: 114,
  toast: 120,
  end: 156,
};

/** A button press: down over `down`, back up over `up`. */
const DIP = { down: 3, up: 9 };

export const promptSwellTimeline = defineTimeline<
  PromptSwellElementId,
  PromptSwellTimingProps
>(({ tiers = DEFAULT_TIERS }) => {
  const elements: TimelineElement<PromptSwellElementId>[] = [
    {
      id: "card",
      lane: "Prompt",
      label: "prompt card",
      start: B.card,
      length: B.type - B.card,
    },
    {
      id: "type",
      lane: "Prompt",
      label: "prompt types",
      start: B.type,
      length: B.armed - B.type,
      follows: "card",
    },
    {
      id: "armed",
      lane: "Prompt",
      label: "send arms",
      start: B.armed,
      length: B.press - B.armed,
      follows: "type",
    },
    {
      id: "pull",
      lane: "Camera",
      label: "camera pulls back",
      start: B.press - 2,
      length: 32,
    },
    {
      id: "press",
      lane: "Prompt",
      label: "send",
      start: B.press,
      length: B.swell - B.press,
      follows: "armed",
      beats: DIP,
    },
    {
      id: "swell",
      lane: "Window",
      label: "card swells into the page",
      start: B.swell,
      length: 30,
      follows: "press",
      beats: { promptOut: 9 },
    },
    {
      id: "chrome",
      lane: "Page",
      label: "browser chrome",
      start: B.chrome - 4,
      length: 14,
    },
    {
      id: "drift",
      lane: "Camera",
      label: "slow push",
      start: B.chrome,
      length: B.end - B.chrome,
    },
    {
      id: "hero",
      lane: "Page",
      label: "hero",
      start: B.hero,
      length: 18,
      beats: { image: 6, imageIn: 24, sub: 4, subIn: 12 },
    },
    {
      id: "tick:0",
      lane: "Steps",
      label: "step 1",
      start: B.tick1,
      length: B.tick2 - B.tick1,
      beats: { tick: 8, done: 6 },
    },
    {
      id: "scroll:0",
      lane: "Page",
      label: "scroll to pricing",
      start: B.scroll1,
      length: B.scroll2 - B.scroll1,
      beats: { title: 2, sub: 4, fade: 12 },
    },
  ];
  tiers.slice(0, 3).forEach((tier, i) => {
    elements.push({
      id: `plan:${i}`,
      lane: "Plans",
      label: tier.name,
      start: B.plans + i * 4,
      length: 14,
      follows: i > 0 ? `plan:${i - 1}` : undefined,
    });
  });
  elements.push(
    {
      id: "tick:1",
      lane: "Steps",
      label: "step 2",
      start: B.tick2,
      length: B.tick3 - B.tick2,
      follows: "tick:0",
      beats: { tick: 8, done: 6 },
    },
    {
      id: "scroll:1",
      lane: "Page",
      label: "scroll to the waitlist",
      start: B.scroll2,
      length: B.publish - B.scroll2,
      follows: "scroll:0",
      beats: { wait: 2, waitIn: 14 },
    },
    {
      id: "tick:2",
      lane: "Steps",
      label: "step 3",
      start: B.tick3,
      length: B.publish - B.tick3,
      follows: "tick:1",
      // The status line reads ready `done` after the last tick.
      beats: { tick: 8, done: 6 },
    },
    {
      id: "publish",
      lane: "Publish",
      label: "publish",
      start: B.publish,
      length: B.toast - B.publish,
      beats: DIP,
    },
    {
      id: "toast",
      lane: "Publish",
      label: "live toast",
      start: B.toast,
      length: B.end - B.toast,
      follows: "publish",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
