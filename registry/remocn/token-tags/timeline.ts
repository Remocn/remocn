import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The token audit: the rest of the UI washing out around the focus, then
// every token tag one after another, its dot popping on the element, the
// leader drawing out and the chip landing at the end of it. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type TokenTagsElementId = "wash" | `tag:${number}`;

export interface TokenTagsTimingProps {
  tokens?: readonly { label: string }[];
  focus?: unknown;
  children?: unknown;
  stagger?: number;
}

/** Frame the first tag starts. */
const START = 12;
const STAGGER = 6;
/** The demo dashboard's tokens (`DEMO.after.tokens` in audit-core). */
const DEMO_TOKENS = [
  "state/success/lighter",
  "text/strong-950",
  "state/warning/base",
  "state/error/base",
  "stroke/soft-200",
];

// `wash` fades everything outside the focus over its length (only when there
// is a focus). `tag:<i>` pops token i's dot at its start, draws the leader
// and lands the chip by its end; the tags form a chain.
export const tokenTagsTimeline = defineTimeline<
  TokenTagsElementId,
  TokenTagsTimingProps
>(({ tokens, focus, children, stagger = STAGGER }) => {
  const labels = tokens
    ? tokens.map((t) => t.label)
    : children
      ? []
      : DEMO_TOKENS;
  const hasFocus = focus !== undefined ? focus !== null : !children;
  const elements: TimelineElement<TokenTagsElementId>[] = [];
  if (hasFocus) {
    elements.push({
      id: "wash",
      lane: "Focus",
      label: "Wash",
      start: 0,
      length: 12,
    });
  }
  labels.forEach((label, i) => {
    elements.push({
      id: `tag:${i}`,
      lane: "Tags",
      label,
      start: START + i * stagger,
      length: 25,
      follows: i > 0 ? `tag:${i - 1}` : undefined,
    });
  });
  return elements;
});
