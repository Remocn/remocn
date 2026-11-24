import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A "what's new" modal: the app comes in, the backdrop dims, the modal pops
// with its fanned cards, then each slide holds for `dwell` before the next
// swipes in, while the camera creeps closer; the cursor arrives and presses
// the last call to action. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type WhatsNewModalElementId =
  | "app"
  | "dim"
  | "modal"
  | "camera"
  | "fan"
  | `slide:${number}`
  | "cursor"
  | "press";

export interface WhatsNewModalTimingProps {
  slides?: { title: string }[];
  dwell?: number;
}

export const DEFAULT_SLIDES: {
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
}[] = [
  {
    eyebrow: "New in 2.0",
    title: "Launch videos, built from components",
    body: "Drop product UI, charts and captions into a scene. Every piece is a React component you own.",
  },
  {
    eyebrow: "Timeline",
    title: "Retime every beat in one place",
    body: "Trim, reorder and stretch scenes. Springs stay in sync at any length.",
  },
  {
    eyebrow: "Cloud render",
    title: "Render in 4K, share in one click",
    body: "Export from the browser and send a review link before your coffee gets cold.",
    cta: "Try it now",
  },
];

const FIRST = 10;
export const DWELL = 66;

export const whatsNewModalTimeline = defineTimeline<
  WhatsNewModalElementId,
  WhatsNewModalTimingProps
>(({ slides = DEFAULT_SLIDES, dwell = DWELL }) => {
  const n = Math.max(1, slides.length);
  const swipeAt = Array.from({ length: n }, (_, i) => FIRST + i * dwell);
  const endAt = swipeAt[n - 1] + dwell - 10;
  const PRESS = endAt + 20;
  const elements: TimelineElement<WhatsNewModalElementId>[] = [
    { id: "app", lane: "App", label: "app", start: 0, length: 10 },
    { id: "dim", lane: "App", label: "backdrop dims", start: 4, length: 14 },
    { id: "modal", lane: "Modal", label: "modal", start: 6, length: 8 },
    // The slow push-in, from the modal's entry past the press.
    { id: "camera", lane: "Camera", label: "push in", start: 6, length: PRESS },
    {
      id: "fan",
      lane: "Modal",
      label: "cards fan out",
      start: 12,
      length: 12,
    },
  ];
  swipeAt.forEach((at, i) => {
    elements.push({
      id: `slide:${i}`,
      lane: "Slides",
      label: slides[i]?.title ?? "slide",
      start: at,
      length: dwell,
      follows: i > 0 ? `slide:${i - 1}` : undefined,
      beats: {
        // The art starts at `art`, the copy at `text`, a line every
        // `stagger` over `line`; a swipe kicks the fanned cards over `kick`,
        // the copy leaves over `exit`, and the progress dot fills until
        // `fillGap` before the slide's end.
        art: i === 0 ? 0 : -2,
        text: i === 0 ? 2 : 4,
        stagger: 2,
        line: 14,
        kick: 16,
        exit: 6,
        fillGap: 4,
      },
    });
  });
  elements.push(
    {
      id: "cursor",
      lane: "Cursor",
      label: "cursor to the button",
      start: endAt,
      length: PRESS - endAt,
      follows: `slide:${n - 1}`,
      beats: { fade: 6 },
    },
    {
      id: "press",
      lane: "Cursor",
      label: "press",
      start: PRESS,
      length: 10,
      follows: "cursor",
      // The button lights from `hover` over `hoverIn`; the press dips from
      // `down` and lets go at `up`.
      beats: { hover: -8, hoverIn: 6, down: -2, up: 3 },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
