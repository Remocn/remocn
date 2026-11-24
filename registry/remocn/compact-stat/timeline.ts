import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The full number rising in character by character, the label, the digits
// past the kept ones reeling back into the short form, the magnitude suffix
// springing in, and the figure growing to its final size over the accent
// ground. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type CompactStatElementId =
  | "rise"
  | "label"
  | "retract"
  | "suffix"
  | "grow";

export interface CompactStatTimingProps {
  value?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  stagger?: number;
}

const RISE_AT = 0;
const RISE_LEN = 18;
export const RISE_GAP = 2;
const LABEL_AT = 12;
const RETRACT_AT = 40;
const RETRACT_LEN = 18;
const SUFFIX_AT = 52;
const GROW_AT = 58;
const GROW_LEN = 28;

const SCALES = ["", "K", "M", "B", "T"];

export interface Plan {
  full: string[];
  short: string[];
  keep: number[];
  sep: number;
  mag: number;
}

export function compactPlan(
  value: number,
  decimals: number,
  suffix: string | undefined,
  prefix: string,
): Plan {
  const v = Math.max(0, Math.floor(Math.abs(value)));
  const digits = String(v);
  const tier = Math.min(
    SCALES.length - 1,
    Math.max(0, Math.floor((digits.length - 1) / 3)),
  );
  const intLen = digits.length - tier * 3;
  let dec = digits.slice(intLen, intLen + Math.max(0, Math.min(2, decimals)));
  dec = dec.replace(/0+$/, "");
  const grouped: string[] = [];
  for (let i = 0; i < digits.length; i++) {
    const fromEnd = digits.length - i;
    if (i > 0 && fromEnd % 3 === 0) grouped.push(",");
    grouped.push(digits[i]);
  }
  const pre = Array.from(prefix);
  const full = [...pre, ...grouped];
  const mag = suffix ?? SCALES[tier];
  const short = [
    ...pre,
    ...Array.from(digits.slice(0, intLen)),
    ...(dec ? [".", ...Array.from(dec)] : []),
    ...Array.from(mag),
  ];
  const keep = full.map(() => -1);
  let j = 0;
  for (let i = 0; i < pre.length; i++) keep[i] = j++;
  let seen = 0;
  let sep = -1;
  const keptDigits = intLen + dec.length;
  for (let i = pre.length; i < full.length; i++) {
    const ch = full[i];
    if (ch === ",") {
      if (seen === intLen && dec.length > 0 && tier > 0) {
        keep[i] = j++;
        sep = i;
      }
      continue;
    }
    if (seen < keptDigits) keep[i] = j++;
    seen++;
  }
  return {
    full,
    short,
    keep,
    sep,
    mag: tier > 0 || suffix ? j : -1,
  };
}

// `rise` lifts the full number's characters, one every `stagger` frames,
// each over `rise`. `retract` reels the dropped digits back over its
// length. `suffix` springs the magnitude in from its start (its length is
// roughly the spring's settle). `grow` scales the figure up over its length
// while the ground fades in until `ground`. The suffix and the grow follow
// the retract.
export const compactStatTimeline = defineTimeline<
  CompactStatElementId,
  CompactStatTimingProps
>(
  ({
    value = 1200000,
    decimals = 1,
    suffix,
    prefix = "",
    stagger = RISE_GAP,
  }) => {
    const chars = compactPlan(value, decimals, suffix, prefix).full.length;
    const elements: TimelineElement<CompactStatElementId>[] = [
      {
        id: "rise",
        lane: "Number",
        label: "Rise",
        start: RISE_AT,
        length: Math.max(0, chars - 1) * stagger + RISE_LEN,
        beats: { stagger, rise: RISE_LEN },
      },
      {
        id: "label",
        lane: "Label",
        label: "Label",
        start: LABEL_AT,
        length: 18,
      },
      {
        id: "retract",
        lane: "Number",
        label: "Retract",
        start: RETRACT_AT,
        length: RETRACT_LEN,
      },
      {
        id: "suffix",
        lane: "Suffix",
        label: "Suffix",
        start: SUFFIX_AT,
        length: 24,
        follows: "retract",
      },
      {
        id: "grow",
        lane: "Number",
        label: "Grow",
        start: GROW_AT,
        length: GROW_LEN,
        follows: "retract",
        beats: { ground: GROW_LEN + 10 },
      },
    ];
    return elements;
  },
);
