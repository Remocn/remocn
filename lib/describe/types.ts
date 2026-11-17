/**
 * Shapes shared by the describe field's server and browser halves.
 *
 * The field turns a sentence ("slower, dark, serif") into a patch of the
 * component's props. Tiers answer in order, cheapest first, and the first
 * that explains the whole sentence wins:
 *
 * 1. `literal`: words and values the parser recognizes (lib/describe/literals)
 * 2. `preset`: the component's own presets and the shared moods, by meaning
 * 3. `device`: the browser's built-in model, where there is one
 * 4. `ai`: Claude Haiku on the server, behind the guard (lib/describe/guard)
 */

/** New values by prop name. Only props the component's controls know. */
export type Patch = Record<string, unknown>;

export type Tier = "literal" | "preset" | "device" | "ai";

/** A named set of prop values for one component (registry/presets). */
export interface Preset {
  id: string;
  /** Two or three words, shown on the chip. */
  label: string;
  /** One sentence on the look, embedded for matching a request. */
  description: string;
  /** How someone might ask for this look; embedded too. */
  askedAs: string[];
  props: Patch;
}

/** Why the model did or did not answer a request. */
export type AiStatus =
  /** Not needed: a free tier explained the request. */
  | "skipped"
  /** The model answered. */
  | "used"
  /** The same request was answered before and came from the cache. */
  | "cached"
  /** No API key or database on this server. */
  | "off"
  /** The visitor is banned for off-topic requests. */
  | "banned"
  /** The visitor used up today's model calls, or sends too fast. */
  | "limited"
  /** The day's budget is spent. */
  | "budget"
  /** The request is not about the animation (a strike). */
  | "rejected"
  /** The model failed; the free tiers' answer stands. */
  | "error";

export interface DescribeRequest {
  name: string;
  text: string;
  /** The values the customizer shows now, so "even slower" has a base. */
  values: Record<string, unknown>;
  /**
   * `free` stops before the model and hands back what the browser's own
   * model needs; `auto` goes on to the server's model when it has to.
   */
  mode: "free" | "auto";
}

export interface DescribeResponse {
  patch: Patch;
  /** The tier that produced the patch, or null when nothing applied. */
  tier: Tier | null;
  /** The preset or mood the request matched, if one did. */
  match?: { kind: "preset" | "mood"; id: string; label: string };
  /** True when the patch accounts for the whole request. */
  understood: boolean;
  ai: AiStatus;
  /**
   * In `free` mode, when the free tiers fell short: the instructions and
   * output schema for the browser's model.
   */
  device?: { system: string; schema: Record<string, unknown> };
}
