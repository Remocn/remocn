import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The audit: the issue counter dropping in, then every off-spec element boxed
// one after another, its note popping on once the box closes. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type AuditBoxesElementId = "counter" | `box:${number}`;

export interface AuditBoxesTimingProps {
  issues?: readonly { note: string }[];
  children?: unknown;
  counterLabel?: string;
  stagger?: number;
}

/** Frame the first box starts drawing. */
const START = 10;
const STAGGER = 4;
/** The demo dashboard's issues (`DEMO.before.issues` in audit-core). */
const DEMO_ISSUES = 7;

// `counter` drops the count chip in over its length. `box:<i>` draws the box
// around issue i, its note popping on at `note`; the boxes form a chain, and
// the counter ticks up as each one starts.
export const auditBoxesTimeline = defineTimeline<
  AuditBoxesElementId,
  AuditBoxesTimingProps
>(({ issues, children, counterLabel = "issues", stagger = STAGGER }) => {
  const count = issues ? issues.length : children ? 0 : DEMO_ISSUES;
  const elements: TimelineElement<AuditBoxesElementId>[] = [];
  if (counterLabel) {
    elements.push({
      id: "counter",
      lane: "Counter",
      label: "counter",
      start: START - 6,
      length: 10,
    });
  }
  for (let i = 0; i < count; i++) {
    elements.push({
      id: `box:${i}`,
      lane: "Boxes",
      label: issues?.[i]?.note ?? `issue ${i + 1}`,
      start: START + i * stagger,
      length: 14,
      follows: i > 0 ? `box:${i - 1}` : undefined,
      beats: { note: 10 },
    });
  }
  return elements;
});
