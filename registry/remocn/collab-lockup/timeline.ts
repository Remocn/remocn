import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The two names sliding in from the sides, the joiner dropping between them,
// the rule drawing under the lockup and the caption rising in, over a dawn
// on the horizon and a slow camera push. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type CollabLockupElementId =
  | "left"
  | "push"
  | "right"
  | "dawn"
  | "joiner"
  | "rule"
  | "caption";

// `left` and `right` slide a name in, fading it in over `fade`; the right
// follows the left. `push` is the slow camera push and `dawn` the horizon
// brightening. `joiner` drops the joiner in, fading it over `fadeIn`; the
// names recoil from its `impact`. `rule` draws the rule and `caption` raises
// the caption, each following the one before.
export const collabLockupTimeline = defineTimeline<
  CollabLockupElementId,
  object
>(() => {
  const elements: TimelineElement<CollabLockupElementId>[] = [
    {
      id: "left",
      lane: "Names",
      label: "Left name",
      start: 0,
      length: 26,
      beats: { fade: 9 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push",
      start: 0,
      length: 150,
    },
    {
      id: "right",
      lane: "Names",
      label: "Right name",
      start: 2,
      length: 26,
      follows: "left",
      beats: { fade: 9 },
    },
    {
      id: "dawn",
      lane: "Horizon",
      label: "Dawn",
      start: 8,
      length: 62,
    },
    {
      id: "joiner",
      lane: "Joiner",
      label: "Joiner",
      start: 16,
      length: 18,
      follows: "right",
      beats: { fadeIn: 6, impact: 9 },
    },
    {
      id: "rule",
      lane: "Rule",
      label: "Rule",
      start: 34,
      length: 28,
      follows: "joiner",
    },
    {
      id: "caption",
      lane: "Caption",
      label: "Caption",
      start: 54,
      length: 24,
      follows: "rule",
    },
  ];
  return elements;
});
