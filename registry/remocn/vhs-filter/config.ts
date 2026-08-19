import { vhsFilterExampleCode } from "@/components/docs/examples/vhs-filter-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const vhsFilterConfig: ComponentConfig = {
  componentName: "VhsFilter",
  importPath: "@/components/remocn/vhs-filter",
  controls: {
    bleed: {
      type: "number",
      min: 0,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Chroma bleed",
      hiddenFromList: false,
    },
    wobble: {
      type: "number",
      min: 0,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Tape wobble",
      hiddenFromList: false,
    },
    noise: {
      type: "number",
      min: 0,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Noise",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
      description: "Intensity",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: vhsFilterExampleCode,
};
