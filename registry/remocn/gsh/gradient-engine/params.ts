import { mesh } from "./shaders/mesh";
import type { GradientParams } from "./types";

/** The mesh kind with its tuned defaults. */
export const defaultParams: GradientParams = { ...mesh.defaults, kind: "mesh" };

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function record(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("Expected an object");
  }
  // Own enumerable fields are intentional: unlike zod, inherited properties are rejected.
  return Object.fromEntries(Object.entries(input));
}

function number(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a number`);
  }
  return value;
}

function integer(value: unknown, name: string): number {
  const parsed = number(value, name);
  if (!Number.isInteger(parsed)) {
    throw new TypeError(`${name} must be an integer`);
  }
  return parsed;
}

function string(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be a string`);
  }
  return value;
}

function fullParams(input: unknown): GradientParams {
  const value = record(input);
  const colors = value.colors;
  if (!Array.isArray(colors) || colors.length < 2 || colors.length > 6) {
    throw new TypeError("colors must contain 2 to 6 entries");
  }
  const dither = record(value.dither);
  const interaction = record(value.interaction);
  const parsed = {
    background: string(value.background, "background"),
    blur: number(value.blur, "blur"),
    colors: colors.map((color) => string(color, "colors")),
    dither: {
      cell: number(dither.cell, "dither.cell"),
      enabled: boolean(dither.enabled, "dither.enabled"),
      levels: number(dither.levels, "dither.levels"),
    },
    grain: number(value.grain, "grain"),
    interaction: {
      pointer: number(interaction.pointer, "interaction.pointer"),
      scroll: number(interaction.scroll, "interaction.scroll"),
    },
    kind: string(value.kind, "kind"),
    loopSeconds: number(value.loopSeconds, "loopSeconds"),
    scale: number(value.scale, "scale"),
    seed: integer(value.seed, "seed"),
    speed: number(value.speed, "speed"),
    warp: number(value.warp, "warp"),
  };
  return value.drift === undefined
    ? parsed
    : { ...parsed, drift: number(value.drift, "drift") };
}

function boolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(`${name} must be a boolean`);
  }
  return value;
}

function partialParams(input: unknown): Partial<GradientParams> {
  const value = record(input);
  const output: Partial<GradientParams> = {};
  if ("background" in value)
    output.background = string(value.background, "background");
  if ("blur" in value) output.blur = number(value.blur, "blur");
  if ("colors" in value) {
    if (
      !Array.isArray(value.colors) ||
      value.colors.length < 2 ||
      value.colors.length > 6
    )
      throw new TypeError("colors must contain 2 to 6 entries");
    output.colors = value.colors.map((color) => string(color, "colors"));
  }
  if ("grain" in value) output.grain = number(value.grain, "grain");
  if ("kind" in value) output.kind = string(value.kind, "kind");
  if ("drift" in value) output.drift = number(value.drift, "drift");
  if ("loopSeconds" in value)
    output.loopSeconds = number(value.loopSeconds, "loopSeconds");
  if ("scale" in value) output.scale = number(value.scale, "scale");
  if ("seed" in value) output.seed = integer(value.seed, "seed");
  if ("speed" in value) output.speed = number(value.speed, "speed");
  if ("warp" in value) output.warp = number(value.warp, "warp");
  if ("dither" in value) {
    const dither = partialDither(value.dither);
    output.dither = {
      ...defaultParams.dither,
      ...dither,
    };
  }
  if ("interaction" in value) {
    const interaction = partialInteraction(value.interaction);
    output.interaction = {
      ...defaultParams.interaction,
      ...interaction,
    };
  }
  return output;
}

function partialDither(input: unknown): Partial<GradientParams["dither"]> {
  const value = record(input);
  const output: Partial<GradientParams["dither"]> = {};
  if ("cell" in value) output.cell = number(value.cell, "dither.cell");
  if ("levels" in value) output.levels = number(value.levels, "dither.levels");
  if ("enabled" in value) {
    output.enabled = boolean(value.enabled, "dither.enabled");
  }
  return output;
}

function partialInteraction(
  input: unknown,
): Partial<GradientParams["interaction"]> {
  const value = record(input);
  const output: Partial<GradientParams["interaction"]> = {};
  if ("pointer" in value)
    output.pointer = number(value.pointer, "interaction.pointer");
  if ("scroll" in value)
    output.scroll = number(value.scroll, "interaction.scroll");
  return output;
}

/** Validates and clamps a full params object. Throws on a malformed shape. */
export function normalizeParams(input: GradientParams): GradientParams {
  const parsed = fullParams(input);
  const normalized = {
    ...parsed,
    blur: clamp(parsed.blur, 0, 1),
    colors: parsed.colors.slice(0, 6),
    dither: {
      cell: Math.round(clamp(parsed.dither.cell, 1, 32)),
      enabled: parsed.dither.enabled,
      levels: Math.round(clamp(parsed.dither.levels, 2, 32)),
    },
    grain: clamp(parsed.grain, 0, 1),
    interaction: {
      pointer: clamp(parsed.interaction.pointer, 0, 1),
      scroll: clamp(parsed.interaction.scroll, 0, 1),
    },
    loopSeconds: clamp(parsed.loopSeconds, 4, 30),
    scale: clamp(parsed.scale, 0.25, 4),
    speed: clamp(parsed.speed, 0, 2),
    warp: clamp(parsed.warp, 0, 1),
  };
  if (parsed.drift !== undefined) {
    normalized.drift = clamp(parsed.drift, 0, 2);
  }
  return normalized;
}

/** Merges a partial update into full params, keeping nested objects whole. */
export function mergeParams(
  base: GradientParams,
  patch: Partial<GradientParams>,
): GradientParams {
  return normalizeParams({
    ...base,
    ...patch,
    dither: { ...base.dither, ...patch.dither },
    interaction: { ...base.interaction, ...patch.interaction },
  });
}

export function serializeParams(p: GradientParams): string {
  return encodeURIComponent(JSON.stringify(normalizeParams(p)));
}

export function parseParams(s: string): GradientParams {
  try {
    const raw: unknown = JSON.parse(decodeURIComponent(s));
    const parsed = partialParams(raw);
    return normalizeParams({
      ...defaultParams,
      ...parsed,
      dither: { ...defaultParams.dither, ...parsed.dither },
      interaction: { ...defaultParams.interaction, ...parsed.interaction },
    });
  } catch {
    return defaultParams;
  }
}
