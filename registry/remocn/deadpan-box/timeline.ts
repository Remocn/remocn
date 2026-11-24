import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The brand's masthead growing into the quote box, the quote rising in line
// by line, the deadpan beat, then the box flooding the frame for the
// punchline, the attribution and the sign-off rising in. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type DeadpanBoxElementId =
  | "grow"
  | `line:${number}`
  | "punch"
  | "attribution"
  | "sign";

export interface DeadpanBoxTimingProps {
  quote?: string;
  stagger?: number;
  punchAt?: number;
}

export const DEFAULT_QUOTE = "Nobody watches launch videos.";
const LINE_STAGGER = 5;
const PUNCH_AT = 92; // after a deadpan beat of a little over a second

const GROW_AT = 12;
const GROW_LEN = 24;
const HEIGHT_AT = 3;
const MAST_AT = 6;
const MAST_OUT = 9;
const QUOTE_AT = 28;
const LINE_RISE = 22;
const PUNCH_LEN = 16;
const ATTRIBUTION_AT = 8;
const SIGN_AT = 16;
const SETTLE_IN = 18;

/** Lines the quote is set on: its own breaks, else two from three words. */
function lineCount(quote: string) {
  if (quote.includes("\n")) return quote.split("\n").length;
  return quote.trim().split(/\s+/).length < 3 ? 1 : 2;
}

// `grow` widens the masthead into the quote box over `width`, raises it
// from `heightAt` over `height` and fades the masthead's logo from `mastAt`
// over `mast`. `line:<i>` raises quote line i; the lines form a chain,
// `stagger` apart. `punch` floods the frame at `punchAt`; `attribution` and
// `sign` rise in after it, each following the one before.
export const deadpanBoxTimeline = defineTimeline<
  DeadpanBoxElementId,
  DeadpanBoxTimingProps
>(({ quote = DEFAULT_QUOTE, stagger = LINE_STAGGER, punchAt = PUNCH_AT }) => {
  const elements: TimelineElement<DeadpanBoxElementId>[] = [
    {
      id: "grow",
      lane: "Box",
      label: "grow",
      start: GROW_AT,
      length: HEIGHT_AT + GROW_LEN,
      beats: {
        width: GROW_LEN,
        heightAt: HEIGHT_AT,
        height: GROW_LEN,
        mastAt: MAST_AT,
        mast: MAST_OUT,
      },
    },
  ];
  const lines = lineCount(quote);
  // A quote the scene breaks itself is labelled by line number.
  const set = quote.includes("\n")
    ? quote.split("\n").map((l) => l.trim())
    : lines === 1
      ? [quote.trim()]
      : [];
  for (let i = 0; i < lines; i++) {
    elements.push({
      id: `line:${i}`,
      lane: "Quote",
      label: set[i] ?? `line ${i + 1}`,
      start: QUOTE_AT + i * stagger,
      length: LINE_RISE,
      follows: i > 0 ? `line:${i - 1}` : "grow",
    });
  }
  elements.push(
    {
      id: "punch",
      lane: "Box",
      label: "punchline",
      start: punchAt,
      length: PUNCH_LEN,
    },
    {
      id: "attribution",
      lane: "Quote",
      label: "attribution",
      start: punchAt + ATTRIBUTION_AT,
      length: SETTLE_IN,
      follows: "punch",
    },
    {
      id: "sign",
      lane: "Sign",
      label: "sign-off",
      start: punchAt + SIGN_AT,
      length: SETTLE_IN,
      follows: "attribution",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
