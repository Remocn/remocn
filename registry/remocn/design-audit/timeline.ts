import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The design audit: the dashboard enters, red redlines and issue boxes mark
// the old build, a scan band wipes the fixed build in, the camera pushes in
// on one element for its specs and tokens, pulls back, and guides draw over
// the result. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type DesignAuditElementId =
  | "enter"
  | "redlines"
  | "issues"
  | "scan"
  | "zoom-in"
  | "callouts"
  | "tokens"
  | "zoom-out"
  | "guides";

/** The scene's timing does not depend on its props. */
export type DesignAuditTimingProps = object;

/** Frames the demo needs from the first frame to the guides settling. */
export const DESIGN_AUDIT_LENGTH = 332;

export const designAuditTimeline = defineTimeline<
  DesignAuditElementId,
  DesignAuditTimingProps
>((): TimelineElement<DesignAuditElementId>[] => [
  { id: "enter", lane: "Stage", label: "dashboard in", start: 0, length: 18 },
  { id: "redlines", lane: "Audit", label: "redlines", start: 14, length: 20 },
  {
    id: "issues",
    lane: "Audit",
    label: "issue boxes",
    start: 34,
    length: 38,
    follows: "redlines",
  },
  {
    id: "scan",
    lane: "Scan",
    label: "scan to the fix",
    start: 72,
    length: 64,
    // The band fades in from `lead` to `lit` and out over the last `fade`.
    beats: { lead: -4, lit: 2, fade: 8 },
  },
  {
    id: "zoom-in",
    lane: "Camera",
    label: "push in",
    start: 156,
    length: 22,
    // The blue redlines fade out over the frames before the push.
    beats: { clear: -10 },
  },
  {
    id: "callouts",
    lane: "Close-up",
    label: "specs",
    start: 180,
    length: 28,
    follows: "zoom-in",
    beats: { stagger: 4 },
  },
  {
    id: "tokens",
    lane: "Close-up",
    label: "tokens",
    start: 208,
    length: 44,
    follows: "callouts",
  },
  {
    id: "zoom-out",
    lane: "Camera",
    label: "pull back",
    start: 252,
    length: 22,
    follows: "tokens",
    // The close-up marks fade out from `hide` to `gone`.
    beats: { hide: -4, gone: 6 },
  },
  {
    id: "guides",
    lane: "Guides",
    label: "guides",
    start: 278,
    length: DESIGN_AUDIT_LENGTH - 278,
    follows: "zoom-out",
  },
]);
