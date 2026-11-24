import { defineTimeline } from "@/lib/remocn/timeline";

// The star count rolls up while the stargazer list scrolls with an elastic
// recoil, and the newest row lights up as it settles. All three are fitted
// to the clip: the scroll spans it, the count its first 80%, the highlight
// its last 8%. Frames on the 30 fps scene timeline, after `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type GitHubStarsElementId = "counter" | "scroll" | "settle";

/** The count reaches its total this far into the clip. */
export const COUNT_PORTION = 0.8;
/** The newest row's highlight fades in from this far into the clip. */
const SETTLE_AT = 0.92;

export const gitHubStarsTimeline = defineTimeline<GitHubStarsElementId, object>(
  (_, { length }) => [
    {
      id: "counter",
      lane: "Counter",
      label: "star count",
      start: 0,
      length: length * COUNT_PORTION,
    },
    { id: "scroll", lane: "List", label: "scroll", start: 0, length },
    {
      id: "settle",
      lane: "Highlight",
      label: "newest row",
      start: length * SETTLE_AT,
      length: length - length * SETTLE_AT,
    },
  ],
);
