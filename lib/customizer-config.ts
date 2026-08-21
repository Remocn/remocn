import type { InteractivitySchema, InteractivitySchemaField } from "remotion";
import type { BackdropFill } from "@/registry/remocn/backdrop";

/**
 * Internal control descriptors consumed by the docs customizer UI and the
 * nuqs parsers. Authored configs no longer use this shape — they declare a
 * Remotion `InteractivitySchema` and `resolveControls` converts it here.
 */
export type ControlType =
  | { type: "text"; default: string; label: string }
  | {
      type: "number";
      default: number;
      min: number;
      max: number;
      step: number;
      label: string;
    }
  | {
      type: "number-input";
      default: number;
      min: number;
      max: number;
      step: number;
      label: string;
    }
  | { type: "color"; default: string; label: string }
  | { type: "select"; default: string; options: string[]; label: string }
  | { type: "boolean"; default: boolean; label: string };

export type ControlConfig = Record<string, ControlType>;

export interface ComponentConfig {
  /**
   * Remotion `InteractivitySchema` describing the component's props — the
   * same format official Remotion Elements use, so the Studio element
   * generator can embed it verbatim. Convention: a `number` field with `max`
   * renders as a slider in the docs customizer, without `max` as an input.
   * Defaults must be concrete (the site needs them), even though Remotion's
   * type allows `undefined`.
   */
  controls: InteractivitySchema;
  /**
   * Element bounding box in composition pixels (1920×1080 space) for the
   * Studio element payload. Sized to the rendered content at default props,
   * with headroom for the animation's travel. Omit for full-frame components
   * (backgrounds, shaders, filters, transitions) — they keep a `null` box
   * and fill the composition.
   */
  dimensions?: { width: number; height: number };
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  /**
   * Import statement shown in the generated code snippet.
   * Example: `import { SoftBlurIn } from "@/components/remocn/soft-blur-in";`
   */
  importPath: string;
  /**
   * Pascal-case component name used in the generated JSX snippet.
   */
  componentName: string;
  /**
   * Optional custom code-snippet generator. When present, the preview's
   * `generateCode` delegates to it instead of the default prop serializer
   * (used by the ui-tier primitives to emit a `steps={[…]}` literal and omit
   * preview-only props). Components without it keep the default path.
   */
  snippet?: (values: Record<string, unknown>) => string;
  previewBackdrop?: BackdropFill;
}

/** `ComponentConfig` after `resolveConfig`: schema converted for the site UI. */
export interface ResolvedComponentConfig
  extends Omit<ComponentConfig, "controls"> {
  controls: ControlConfig;
}

export const FPS = 30;
export const W = 1280;
export const H = 720;
export const FONT_WEIGHT_OPTIONS = ["400", "500", "600", "700"];

/** Flat select options expressed as InteractivitySchema enum variants. */
export function enumVariants(
  options: readonly string[],
): Record<string, InteractivitySchema> {
  const out: Record<string, InteractivitySchema> = {};
  for (const option of options) out[option] = {};
  return out;
}

/**
 * Controls present on every animation. Merged into each component's schema
 * by `resolveControls` so every animation in the customizer exposes the same
 * baseline knobs.
 */
export const SHARED_CONTROLS: InteractivitySchema = {
  speed: {
    type: "number",
    default: 1,
    min: 0.25,
    max: 4,
    step: 0.25,
    description: "Speed",
    hiddenFromList: false,
  },
};

/** Components that opt out of the shared `speed` control entirely. */
const NO_SHARED_SPEED = new Set(["backdrop", "stage"]);

/**
 * Components whose animation rides a shared progress driver that must reach its
 * final frame — a count-up landing on the last frame, a lockup revealed at a
 * fixed point. A speed < 1 stalls the driver before the payoff, so these cap
 * `speed` at a minimum of 1 instead of the shared 0.25.
 */
const SPEED_MIN_ONE = new Set([
  "chat-gpt",
  "claude-chat",
  "claude-code",
  "github-sponsors",
  "github-stars",
  "number-wheel",
  "opencode",
  "rolling-number",
  "v0",
  "x-follow-card",
  "x-followers-overview",
]);

const SPEED_MIN_ONE_FIELD: InteractivitySchemaField = {
  type: "number",
  default: 1,
  min: 1,
  max: 4,
  step: 0.25,
  description: "Speed",
  hiddenFromList: false,
};

/**
 * Merges the shared schema fields into a component's schema, applying the
 * per-component speed rules. Returns the schema that also feeds the Studio
 * element generator.
 */
export function resolveSchema(
  slug: string,
  schema: InteractivitySchema,
): InteractivitySchema {
  const out: InteractivitySchema = { ...schema, ...SHARED_CONTROLS };
  if (NO_SHARED_SPEED.has(slug)) {
    delete out.speed;
    return out;
  }
  // Reassigning the existing key keeps `speed` in its merged position.
  if (SPEED_MIN_ONE.has(slug)) out.speed = SPEED_MIN_ONE_FIELD;
  return out;
}

/**
 * Converts one schema field into the customizer's internal control shape.
 * Returns null for field types the docs customizer does not render
 * (`hidden`, transform fields, captions, …).
 */
export function schemaFieldToControl(
  field: InteractivitySchemaField,
): ControlType | null {
  switch (field.type) {
    case "text-content":
      return {
        type: "text",
        default: field.default,
        label: field.description ?? "",
      };
    case "number": {
      if (field.default === null || field.default === undefined) return null;
      const base = {
        default: field.default,
        min: field.min ?? 0,
        step: field.step ?? 1,
        label: field.description ?? "",
      };
      return field.max === undefined
        ? { type: "number-input", max: Number.MAX_SAFE_INTEGER, ...base }
        : { type: "number", max: field.max, ...base };
    }
    case "color":
      if (field.default === undefined) return null;
      return {
        type: "color",
        default: field.default,
        label: field.description ?? "",
      };
    case "boolean":
      return {
        type: "boolean",
        default: field.default,
        label: field.description ?? "",
      };
    case "enum":
      return {
        type: "select",
        default: field.default,
        options: Object.keys(field.variants),
        label: field.description ?? "",
      };
    default:
      return null;
  }
}

export function schemaToControls(schema: InteractivitySchema): ControlConfig {
  const out: ControlConfig = {};
  for (const [key, field] of Object.entries(schema)) {
    const control = schemaFieldToControl(field);
    if (control) out[key] = control;
  }
  return out;
}

export function resolveControls(
  slug: string,
  schema: InteractivitySchema,
): ControlConfig {
  return schemaToControls(resolveSchema(slug, schema));
}

export function resolveConfig(
  slug: string,
  config: ComponentConfig,
): ResolvedComponentConfig {
  return { ...config, controls: resolveControls(slug, config.controls) };
}

export function getDefaults(controls: ControlConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, ctrl] of Object.entries(controls)) {
    out[key] = ctrl.default;
  }
  return out;
}
