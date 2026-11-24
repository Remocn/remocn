import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Three phones of a portfolio: they rise one after another, the left screen
// scrolls, the middle one flicks twice, the right one scrolls, then the
// middle phone steps forward and the live banner drops in, all under a slow
// camera push. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type PhoneTrioElementId =
  | `phone:${number}`
  | "push"
  | "scroll-left"
  | `flick:${number}`
  | "scroll-right"
  | "forward"
  | "banner";

/** The scene's timing does not depend on its props. */
export type PhoneTrioTimingProps = object;

// The phones rise before the first frame: frame 0 already shows them moving.
const B = {
  rise: [-12, -8, -4],
  scrollL: 10,
  flick1: 14,
  scrollR: 20,
  flick2: 44,
  forward: 70,
  banner: 84,
  end: 132,
};

const PHONES = ["left phone", "middle phone", "right phone"];

export const phoneTrioTimeline = defineTimeline<
  PhoneTrioElementId,
  PhoneTrioTimingProps
>(() => {
  const elements: TimelineElement<PhoneTrioElementId>[] = B.rise.map(
    (at, i) => ({
      id: `phone:${i}`,
      lane: "Phones",
      label: PHONES[i],
      start: at,
      length: 24,
      follows: i > 0 ? `phone:${i - 1}` : undefined,
    }),
  );
  elements.push(
    // The slow push-in under the whole scene.
    { id: "push", lane: "Camera", label: "push in", start: 0, length: B.end },
    {
      id: "scroll-left",
      lane: "Screens",
      label: "left screen scrolls",
      start: B.scrollL,
      length: 96,
    },
    {
      id: "flick:0",
      lane: "Middle screen",
      label: "first flick",
      start: B.flick1,
      length: B.flick2 - B.flick1,
    },
    {
      id: "scroll-right",
      lane: "Screens",
      label: "right screen scrolls",
      start: B.scrollR,
      length: 70,
    },
    {
      id: "flick:1",
      lane: "Middle screen",
      label: "second flick",
      start: B.flick2,
      length: 30,
      follows: "flick:0",
    },
    {
      id: "forward",
      lane: "Stage",
      label: "middle phone forward",
      start: B.forward,
      length: B.banner - B.forward,
    },
    {
      id: "banner",
      lane: "Stage",
      label: "live banner",
      start: B.banner,
      length: B.end - B.banner,
      follows: "forward",
    },
  );
  return elements;
});
