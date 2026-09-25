import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getCodeMorphDuration } from ".";

const numberOf = (value: unknown) =>
  typeof value === "number" ? value : undefined;

function durationOf(values: Record<string, unknown>) {
  return getCodeMorphDuration({
    morphDuration: numberOf(values.morphDuration),
    highlight: values.highlight !== false,
    speed: numberOf(values.speed),
  });
}

export const codeMorphConfig: ComponentConfig = {
  componentName: "CodeMorph",
  importPath: "@/components/remocn/code-morph",
  controls: {
    filename: {
      type: "text-content",
      default: "invoices.tsx",
      description: "Filename",
    },
    theme: {
      type: "enum",
      default: "dark",
      variants: { dark: {}, light: {} },
      description: "Theme",
    },
    accentColor: { type: "color", default: "#0ea5e9", description: "Accent" },
    morphDuration: {
      type: "number",
      default: 36,
      min: 12,
      max: 90,
      step: 1,
      description: "Morph frames",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      default: 20,
      min: 12,
      max: 32,
      step: 1,
      description: "Font size",
      hiddenFromList: false,
    },
    highlight: {
      type: "boolean",
      default: true,
      description: "Highlight changes",
    },
    lineNumbers: {
      type: "boolean",
      default: true,
      description: "Line numbers",
    },
    windowDots: {
      type: "boolean",
      default: true,
      description: "Window dots",
    },
  },
  durationInFrames: 138,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
