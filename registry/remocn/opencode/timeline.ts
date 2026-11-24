import { defineTimeline } from "@/lib/remocn/timeline";

// The prompt screen bouncing in, the logo, the input box and the key hints
// fading up one after another, then the query typing in. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type OpenCodeElementId = "intro" | "logo" | "box" | "hints" | "typing";

export interface OpenCodeTimingProps {
  query?: string;
}

export const DEFAULT_QUERY = '"What is the tech stack of this project?"';
/** The query starts typing here, at `TYPE_CPS` characters a second. */
export const TYPE_AT = 48;
export const TYPE_CPS = 20;
/** Frames the intro spring takes to settle. */
const INTRO = 18;
const FADE_UP = 18;

// `typing` lasts as long as the query takes to type: stretching it types
// slower.
export const openCodeTimeline = defineTimeline<
  OpenCodeElementId,
  OpenCodeTimingProps
>(({ query = DEFAULT_QUERY }) => [
  { id: "intro", lane: "Screen", label: "bounce in", start: 0, length: INTRO },
  { id: "logo", lane: "Fades", label: "logo", start: 4, length: FADE_UP },
  { id: "box", lane: "Fades", label: "input box", start: 12, length: FADE_UP },
  { id: "hints", lane: "Fades", label: "hints", start: 20, length: FADE_UP },
  {
    id: "typing",
    lane: "Query",
    label: query,
    start: TYPE_AT,
    length: (query.length / TYPE_CPS) * 30,
  },
]);
