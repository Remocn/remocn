import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The number's first characters rising in, the label rising, the count
// climbing (new places join the line as it reaches them) and the sky fill
// sweeping across the finished number. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type PackedCountElementId = "rise" | "label" | "count" | "fill";

export interface PackedCountTimingProps {
  value?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  countLength?: number;
}

export const DEFAULT_VALUE = 41900;
export const DEFAULT_FROM = 120;

const RISE_AT = 0;
const RISE_LEN = 16;
const RISE_GAP = 3;
const LABEL_AT = 10;
const COUNT_AT = 18;
const COUNT_LEN = 64;
const FILL_LEN = 20;

export interface Slot {
  ch: string;
  index: number;
  kind: "digit" | "sep" | "fix";
  place: number;
}

export function group(n: number) {
  const s = String(Math.max(0, Math.floor(n)));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const fromEnd = s.length - i;
    if (i > 0 && fromEnd % 3 === 0) out += ",";
    out += s[i];
  }
  return out;
}

export function buildSlots(
  value: number,
  prefix: string,
  suffix: string,
): Slot[] {
  const body = Array.from(group(value));
  const slots: Slot[] = [];
  Array.from(prefix).forEach((ch) => {
    slots.push({ ch, index: slots.length, kind: "fix", place: -1 });
  });
  let digitsRight = body.filter((c) => c !== ",").length;
  for (const ch of body) {
    if (ch === ",") {
      slots.push({ ch, index: slots.length, kind: "sep", place: digitsRight });
    } else {
      digitsRight--;
      slots.push({
        ch,
        index: slots.length,
        kind: "digit",
        place: digitsRight,
      });
    }
  }
  Array.from(suffix).forEach((ch) => {
    slots.push({ ch, index: slots.length, kind: "fix", place: -1 });
  });
  return slots;
}

/** The count's end value and its first value, as whole positive numbers. */
export function countRange(value: number, from: number) {
  const target = Math.max(1, Math.floor(Math.abs(value)));
  const start = Math.min(target, Math.max(1, Math.floor(Math.abs(from))));
  return { target, start };
}

// `rise` lifts the characters already there at the start, one every `gap`
// frames, each over `rise`. `count` climbs over its length; the places the
// count reaches join the line as it goes. `fill` sweeps the sky colour
// across the characters, one every `step` frames, each over `fill`; it
// follows `count`, starting just before its end.
export const packedCountTimeline = defineTimeline<
  PackedCountElementId,
  PackedCountTimingProps
>(
  ({
    value = DEFAULT_VALUE,
    from = DEFAULT_FROM,
    prefix = "",
    suffix = "",
    countLength = COUNT_LEN,
  }) => {
    const { target, start } = countRange(value, from);
    const slots = buildSlots(target, prefix, suffix);
    const startDigits = String(start).length;
    const openers = slots
      .filter((s) => s.kind === "fix" || s.place < startDigits)
      .map((s) => s.index);
    const spread =
      openers.length > 0 ? openers[openers.length - 1] - openers[0] : 0;
    const fillAt = COUNT_AT + countLength - 2;
    const fillStep = slots.length > 1 ? 10 / (slots.length - 1) : 0;
    const elements: TimelineElement<PackedCountElementId>[] = [
      {
        id: "rise",
        lane: "Number",
        label: "Rise",
        start: RISE_AT,
        length: spread * RISE_GAP + RISE_LEN,
        beats: { gap: RISE_GAP, rise: RISE_LEN },
      },
      {
        id: "label",
        lane: "Label",
        label: "Label",
        start: LABEL_AT,
        length: 18,
      },
      {
        id: "count",
        lane: "Number",
        label: "Count",
        start: COUNT_AT,
        length: countLength,
      },
      {
        id: "fill",
        lane: "Fill",
        label: "Fill",
        start: fillAt,
        length: (slots.length - 1) * fillStep + FILL_LEN,
        follows: countLength >= 2 ? "count" : undefined,
        beats: { step: fillStep, fill: FILL_LEN },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
