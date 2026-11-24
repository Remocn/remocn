import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A list of search queries scrolls up and stops on the hero query, which
// grows into a search field while the rest spread away. The term lights up
// and gets its rule, Enter is pressed, and the query resolves into the
// answer with the logo under it. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type QueryCascadeElementId =
  | "scroll"
  | "hero"
  | "clear"
  | "grow"
  | "field"
  | "tint"
  | "rule"
  | "enter"
  | "resolve"
  | "logo";

export interface QueryCascadeTimingProps {
  hero?: string;
  term?: string;
}

export const DEFAULT_HERO = "how to make a launch video";
export const DEFAULT_TERM = "launch video";

// `scroll` runs the list up and stops on the hero over its length. `hero`
// brightens the hero query, `clear` spreads the other rows away, `grow`
// sizes the hero up, `field` springs the search field in. `tint` colors the
// term, `rule` draws its underline. `enter` presses the key, letting go
// `release` after. `resolve` fades the field out from `fieldOut` over
// `fieldFade` (before its start), lets the query leave over `leave`, moves
// the term from `moveAt` over `move`, and brings the answer's words in from
// `arriveAt` over `arrive`, `stagger` apart. `logo` fades the logo in.
export const queryCascadeTimeline = defineTimeline<
  QueryCascadeElementId,
  QueryCascadeTimingProps
>(({ hero = DEFAULT_HERO, term = DEFAULT_TERM }) => {
  const elements: TimelineElement<QueryCascadeElementId>[] = [
    { id: "scroll", lane: "List", label: "Scroll", start: 0, length: 54 },
    { id: "hero", lane: "Hero", label: hero, start: 32, length: 22 },
    { id: "clear", lane: "List", label: "Spread", start: 40, length: 22 },
    { id: "grow", lane: "Hero", label: "Grow", start: 42, length: 26 },
    {
      id: "field",
      lane: "Field",
      label: "Search field",
      start: 44,
      length: 16,
    },
    { id: "tint", lane: "Term", label: term, start: 72, length: 16 },
    { id: "rule", lane: "Term", label: "Underline", start: 78, length: 18 },
    {
      id: "enter",
      lane: "Field",
      label: "Enter",
      start: 92,
      length: 12,
      beats: { release: 7 },
    },
    {
      id: "resolve",
      lane: "Answer",
      label: "Answer",
      start: 104,
      length: 31,
      follows: "enter",
      beats: {
        fieldOut: -4,
        fieldFade: 10,
        leave: 12,
        moveAt: 2,
        move: 22,
        arriveAt: 10,
        arrive: 16,
        stagger: 5,
      },
    },
    {
      id: "logo",
      lane: "Logo",
      label: "Logo",
      start: 132,
      length: 16,
      follows: "resolve",
    },
  ];
  return elements;
});
