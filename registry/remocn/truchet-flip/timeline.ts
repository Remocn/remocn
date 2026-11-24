import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Waves of quarter turns sweep the tile grid: `passes` scrambling waves, then
// a resolve wave that turns every tile still off its target, and with `loop`
// a wave back to the start. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type TruchetFlipElementId = `pass:${number}` | "resolve" | "back";

export interface TruchetFlipTimingProps {
  passes?: number;
  loop?: boolean;
}

const LEAD = 6;
const SPREAD = 30;
const SNAP = 12;
const GAP = 24;
const RESOLVE_GAP = 30;
const HOLD = 18;
const LOOP_HOLD = 24;
const MAX_PASSES = 4;
const DEFAULT_PASSES = 2;

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** When each wave starts and how long the whole film runs. */
export function truchetFlipPlan(options: TruchetFlipTimingProps = {}) {
  const requested = finite(options.passes, DEFAULT_PASSES);
  const passes = Math.round(clamp(requested, 0, MAX_PASSES));
  const starts = Array.from({ length: passes }, (_, i) => LEAD + i * GAP);
  const lastPass = LEAD + Math.max(0, passes - 1) * GAP;
  const resolveStart = passes === 0 ? LEAD : lastPass + RESOLVE_GAP;
  const settled = resolveStart + SPREAD + SNAP;
  const returnStart = settled + LOOP_HOLD;
  const loop = options.loop === true;
  const duration = loop ? returnStart + SPREAD + SNAP : settled + HOLD;
  return {
    passes,
    starts,
    resolveStart,
    settled,
    returnStart,
    loop,
    duration,
  };
}

// Each wave reaches the farthest tile `spread` frames after its start and
// every tile snaps round over `snap`. The passes are a chain, the resolve
// follows the last pass and the wave back follows the resolve.
export const truchetFlipTimeline = defineTimeline<
  TruchetFlipElementId,
  TruchetFlipTimingProps
>((props) => {
  const plan = truchetFlipPlan(props);
  const beats = { spread: SPREAD, snap: SNAP };
  const elements: TimelineElement<TruchetFlipElementId>[] = plan.starts.map(
    (start, i) => ({
      id: `pass:${i}` as const,
      lane: "Waves",
      label: `Pass ${i + 1}`,
      start,
      length:
        (i + 1 < plan.passes ? plan.starts[i + 1] : plan.resolveStart) - start,
      follows: i > 0 ? (`pass:${i - 1}` as const) : undefined,
      beats,
    }),
  );
  elements.push({
    id: "resolve",
    lane: "Waves",
    label: "Resolve",
    start: plan.resolveStart,
    length: SPREAD + SNAP,
    follows: plan.passes > 0 ? `pass:${plan.passes - 1}` : undefined,
    beats,
  });
  if (plan.loop) {
    elements.push({
      id: "back",
      lane: "Waves",
      label: "Back to the start",
      start: plan.returnStart,
      length: SPREAD + SNAP,
      follows: "resolve",
      beats,
    });
  }
  return elements;
});
