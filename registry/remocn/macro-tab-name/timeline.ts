import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera comes into focus and pushes in slowly, the cursor arrives and
// clicks the tab, the name types in letter by letter, the caret blinks, then
// the tab's icon morphs into a spinner and resolves back as the title
// updates. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type MacroTabNameElementId =
  | "cursor"
  | "focus"
  | `click:${number}`
  | `char:${number}`
  | "park"
  | "push"
  | "caret"
  | "morph"
  | "resolve"
  | "title";

export interface MacroTabNameTimingProps {
  name?: string;
  stagger?: number;
}

export const DEFAULT_NAME = "Launch Assets";
export const TYPE_STEP = 3;
/** The clip the scene is built for; the push runs to here. */
export const TAB_NAME_END = 108;
const FOCUS_AT = 0;
const FOCUS_LENGTH = 16;
const TYPE_AT = 10;
const SPACE = 6;
const CLICKS = [1, 6];
const PARK_AT = 12;
const MORPH_AT = 60;
const RESOLVE_AT = 86;

// Remotion's `random()` for a string seed, so the jitter in the typing
// rhythm stays exactly as it was.
function mulberry32(a: number) {
  let t = a + 1831565813;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function seeded(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return mulberry32(hash);
}

// The cursor glides in from before the first frame over its length, fading
// in over `fade`; each click presses `press` frames before its start and
// releases `release` after. The focus pulls sharp over its length and the
// push sways in from its start to its end. `char:<i>` types letter i (spaces
// count) and lands over `land`; the letters are a chain, a space taking
// longer. The caret holds solid for `solid` after the last letter, then
// blinks every `blink` frames until its end. The morph shrinks the icon over
// `out` and spins up the ring from `ring`; the resolve fades the ring over
// `ringOut`, brings the icon back from `back` over `backLength`, and the ring
// sweep finishes `sweepEnd` frames from its start. The title follows it.
export const macroTabNameTimeline = defineTimeline<
  MacroTabNameElementId,
  MacroTabNameTimingProps
>(({ name = DEFAULT_NAME, stagger = TYPE_STEP }) => {
  const chars = Array.from(name);
  const times: number[] = [];
  let t = TYPE_AT;
  for (let i = 0; i < chars.length; i++) {
    times.push(t);
    const jitter = Math.round((seeded(`mtn-${i}`) - 0.5) * 2);
    t += chars[i] === " " ? SPACE : stagger + (i > 0 ? jitter : 0);
  }
  const typedEnd = t;

  const elements: TimelineElement<MacroTabNameElementId>[] = [
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor arrives",
      start: -12,
      length: 13,
      beats: { fade: 8 },
    },
    {
      id: "focus",
      lane: "Camera",
      label: "Focus",
      start: FOCUS_AT,
      length: FOCUS_LENGTH,
    },
  ];
  CLICKS.forEach((at, k) => {
    elements.push({
      id: `click:${k}`,
      lane: "Cursor",
      label: `Click ${k + 1}`,
      start: at,
      length: (k + 1 < CLICKS.length ? CLICKS[k + 1] : PARK_AT) - at,
      follows: k > 0 ? `click:${k - 1}` : "cursor",
      beats: { press: -2, release: 1 },
    });
  });
  chars.forEach((char, i) => {
    elements.push({
      id: `char:${i}`,
      lane: "Name",
      label: char,
      start: times[i],
      length: (i + 1 < chars.length ? times[i + 1] : typedEnd) - times[i],
      follows: i > 0 ? `char:${i - 1}` : undefined,
      beats: { land: 4 },
    });
  });
  elements.push(
    {
      id: "park",
      lane: "Cursor",
      label: "Cursor parks",
      start: PARK_AT,
      length: 24,
      follows: `click:${CLICKS.length - 1}`,
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push in",
      start: FOCUS_LENGTH,
      length: TAB_NAME_END - FOCUS_LENGTH,
      follows: "focus",
    },
    {
      id: "caret",
      lane: "Name",
      label: "Caret blinks",
      start: typedEnd,
      length: Math.max(0, MORPH_AT - 2 - typedEnd),
      follows: chars.length > 0 ? `char:${chars.length - 1}` : undefined,
      beats: { solid: 4, blink: 6 },
    },
    {
      id: "morph",
      lane: "Icon",
      label: "Icon morphs to a spinner",
      start: MORPH_AT,
      length: RESOLVE_AT - MORPH_AT,
      beats: { out: 7, ring: 3 },
    },
    {
      id: "resolve",
      lane: "Icon",
      label: "Icon resolves",
      start: RESOLVE_AT,
      length: TAB_NAME_END - RESOLVE_AT,
      follows: "morph",
      beats: { ringOut: 6, back: 2, backLength: 8, sweepEnd: -4 },
    },
    {
      id: "title",
      lane: "Name",
      label: "Title updates",
      start: RESOLVE_AT + 4,
      length: 12,
      follows: "resolve",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
