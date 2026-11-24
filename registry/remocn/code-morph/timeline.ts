import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The code morphs from step to step: each morph moves, fades and grows the
// tokens over its length, then the changed lines get a highlight that rises
// and falls. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type CodeMorphElementId = `morph:${number}` | `highlight:${number}`;

export interface CodeMorphStep {
  at: number;
  code: string;
}

export interface CodeMorphTimingProps {
  steps?: CodeMorphStep[];
  morphDuration?: number;
  highlight?: boolean;
}

export const BEFORE = `import { useEffect, useState } from "react";

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return <InvoiceTable rows={invoices} />;
}`;

export const AFTER = `import useSWR from "swr";

export function Invoices() {
  const { data, isLoading } = useSWR("/api/invoices", fetcher);

  if (isLoading) return <Spinner />;
  return <InvoiceTable rows={data} />;
}`;

export const CODE_MORPH_STEPS: CodeMorphStep[] = [
  { at: 0, code: BEFORE },
  { at: 48, code: AFTER },
];
export const CODE_MORPH_DURATION = 36;

const BASE = 36;
const ENTER_START = 20;
const RISE = 8;
const SHOW = 24;
const FALL = 14;
const HOLD = 24;
const MIN_MORPH = 12;
const MAX_MORPH = 120;

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const phase = (value: number, morph: number) => (value * morph) / BASE;

/** The steps in time order; the default pair when none are given. */
export function codeMorphSteps(steps: CodeMorphStep[] | undefined) {
  const source = Array.isArray(steps) ? steps : CODE_MORPH_STEPS;
  const ordered = source
    .map((step, index) => ({
      index,
      at: Math.max(0, finite(step.at, 0)),
      code: typeof step.code === "string" ? step.code : "",
    }))
    .sort((a, b) => a.at - b.at || a.index - b.index);
  return ordered.length > 0 ? ordered : [{ index: 0, at: 0, code: "" }];
}

/**
 * The morph plan behind the schedule: when each morph runs and its
 * highlight rises and falls, when the scene settles, how long it lasts.
 */
export function codeMorphPlan(options: CodeMorphTimingProps = {}) {
  const requested = finite(options.morphDuration, CODE_MORPH_DURATION);
  const morph = clamp(requested, MIN_MORPH, MAX_MORPH);
  const highlight = options.highlight !== false;
  const steps = codeMorphSteps(options.steps).map((step) => step.at);
  const starts: number[] = [];
  let ready = 0;
  for (const at of steps.slice(1)) {
    const start = Math.max(at, ready);
    starts.push(start);
    ready = start + morph;
  }
  const morphs = starts.map((start, index) => {
    const highlightStart = start + phase(ENTER_START, morph);
    const natural = highlightStart + RISE + SHOW;
    const next = index + 1 < starts.length ? starts[index + 1] : natural;
    const fallStart = Math.min(natural, next);
    return {
      from: index,
      to: index + 1,
      start,
      end: start + morph,
      highlightStart,
      fallStart,
      highlightEnd: fallStart + FALL,
    };
  });
  let settled = 0;
  if (morphs.length > 0) {
    const last = morphs[morphs.length - 1];
    settled = highlight ? Math.max(last.end, last.highlightEnd) : last.end;
  }
  return { morph, highlight, steps, morphs, settled, duration: settled + HOLD };
}

// `morph:<i>` turns step `i` into step `i + 1` over its length (the exits,
// moves and entries scale with it); a chain, since a morph waits for the one
// before it. `highlight:<i>` lights the lines morph `i` changed: it rises
// over `rise`, falls from `fallAt` over `fall`, and follows its morph.
export const codeMorphTimeline = defineTimeline<
  CodeMorphElementId,
  CodeMorphTimingProps
>((props) => {
  const plan = codeMorphPlan(props);
  const elements: TimelineElement<CodeMorphElementId>[] = [];
  plan.morphs.forEach((m, i) => {
    elements.push({
      id: `morph:${i}`,
      lane: "Morphs",
      label: `Step ${m.from + 1} to ${m.to + 1}`,
      start: m.start,
      length: plan.morph,
      follows: i > 0 ? `morph:${i - 1}` : undefined,
    });
    if (plan.highlight) {
      elements.push({
        id: `highlight:${i}`,
        lane: "Highlights",
        label: `Changes in step ${m.to + 1}`,
        start: m.highlightStart,
        length: m.highlightEnd - m.highlightStart,
        follows: `morph:${i}`,
        beats: {
          rise: RISE,
          fallAt: m.fallStart - m.highlightStart,
          fall: FALL,
        },
      });
    }
  });
  return elements;
});
