import type { BackdropFill } from "@/registry/remocn/backdrop";

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
  | { type: "color"; default: string; label: string }
  | { type: "select"; default: string; options: string[]; label: string }
  | { type: "boolean"; default: boolean; label: string };

export type ControlConfig = Record<string, ControlType>;

export interface ComponentConfig {
  controls: ControlConfig;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  /**
   * Import statement shown in the generated code snippet.
   * Example: `import { BlurReveal } from "@/components/remocn/blur-reveal";`
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

export const FPS = 30;
export const W = 1280;
export const H = 720;
export const FONT_WEIGHT_OPTIONS = ["400", "500", "600", "700"];

/**
 * Controls present on every animation. Merged into each component's controls
 * inside the registry index so every animation in the customizer exposes the
 * same baseline knobs.
 */
export const SHARED_CONTROLS: ControlConfig = {
  speed: {
    type: "number",
    default: 1,
    min: 0.25,
    max: 4,
    step: 0.25,
    label: "Speed",
  },
};

export function getDefaults(controls: ControlConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, ctrl] of Object.entries(controls)) {
    out[key] = ctrl.default;
  }
  return out;
}
