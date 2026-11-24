import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The prompt types in token by token while the network fades in and the
// camera drifts; the tokens split apart, fly to the input nodes and fire, the
// pulse hops layer by layer, the camera resolves onto the output node, which
// traces the R before the name reveals. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type NeuralPulseElementId =
  | `token:${number}`
  | "drift"
  | "network"
  | "split"
  | "fly"
  | "fire"
  | `layer:${number}`
  | "resolve"
  | "trace"
  | "name";

export interface NeuralPulseTimingProps {
  input?: string;
  hop?: number;
}

export const DEFAULT_INPUT = "Make a launch film";
/** Hidden layer sizes; the pulse leaves each layer but the output. */
export const HIDDEN = [6, 7, 5];
export const DEFAULT_HOP = 15;
const T_SPLIT = 16;
const T_FLY = 30;
const T_FIRE = 54;
const T_HOP0 = 62;
const TRAVEL = 13;

/** The prompt's tokens, at most five. */
export function inputTokens(input: string) {
  return input.split(/\s+/).filter(Boolean).slice(0, 5);
}

// Tokens appear as a chain. The network fades in node by node from its
// start (`layer` frames per layer, `node` per node, `fade` each) while its
// blur clears between `focusFrom` and `focusTo`. The fly sends token i off
// `stagger * i` frames after its start, each flight `flight` long; the fire
// flashes token i `stagger * i` after its start over `flash`, draws its lead
// over `lead` and dims the leads between `dim` and `dimEnd`. Each layer's
// pulse travels its edges in `travel` and lights the next layer at `arrive`.
// The resolve pulls the camera in from `pull` to its end; the trace runs
// round the R over its length, the mark fills between `fill` and `fillEnd`
// and the node and stroke fade on their beats.
export const neuralPulseTimeline = defineTimeline<
  NeuralPulseElementId,
  NeuralPulseTimingProps
>(({ input = DEFAULT_INPUT, hop = DEFAULT_HOP }) => {
  const tokens = inputTokens(input);
  const elements: TimelineElement<NeuralPulseElementId>[] = tokens.map(
    (token, i) => ({
      id: `token:${i}` as const,
      lane: "Tokens",
      label: token,
      start: i * 2,
      length: 12,
      follows: i > 0 ? (`token:${i - 1}` as const) : undefined,
    }),
  );
  elements.push(
    {
      id: "drift",
      lane: "Camera",
      label: "Camera drifts",
      start: 0,
      length: 200,
    },
    {
      id: "network",
      lane: "Network",
      label: "Network fades in",
      start: 2,
      length: 20,
      beats: { layer: 4, node: 1.5, focusFrom: -2, focusTo: 42 },
    },
    {
      id: "split",
      lane: "Tokens",
      label: "Tokens split",
      start: T_SPLIT,
      length: 12,
    },
    {
      id: "fly",
      lane: "Tokens",
      label: "Tokens fly to the inputs",
      start: T_FLY,
      length: 3 * Math.max(0, tokens.length - 1) + 22,
      follows: "split",
      beats: { stagger: 3, flight: 22 },
    },
    {
      id: "fire",
      lane: "Tokens",
      label: "Tokens fire",
      start: T_FIRE,
      length: T_HOP0 - T_FIRE,
      follows: "fly",
      beats: { stagger: 2, flash: 6, lead: 8, dim: 20, dimEnd: 40 },
    },
  );
  const layers = 1 + HIDDEN.length;
  for (let k = 0; k < layers; k++) {
    elements.push({
      id: `layer:${k}`,
      lane: "Network",
      label: k === 0 ? "Pulse leaves the inputs" : `Pulse hops layer ${k}`,
      start: T_HOP0 + k * hop,
      length: hop,
      follows: k > 0 ? `layer:${k - 1}` : "fire",
      beats: { travel: TRAVEL, arrive: TRAVEL + 2 },
    });
  }
  const resolveAt = T_HOP0 + 4 * hop;
  const traceAt = resolveAt + 32;
  elements.push(
    {
      id: "resolve",
      lane: "Camera",
      label: "Camera resolves",
      start: resolveAt,
      length: 32,
      follows: `layer:${layers - 1}`,
      beats: { pull: 2 },
    },
    {
      id: "trace",
      lane: "Logo",
      label: "Node traces the R",
      start: traceAt,
      length: 34,
      follows: "resolve",
      beats: {
        strokeIn: 4,
        logoIn: 14,
        logoFade: 12,
        fill: 18,
        fillEnd: 42,
        fade: 32,
        fadeEnd: 44,
        strokeOut: 34,
        strokeOutEnd: 50,
      },
    },
    {
      id: "name",
      lane: "Logo",
      label: "Name reveals",
      start: traceAt + 20,
      length: 32,
      follows: "trace",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
