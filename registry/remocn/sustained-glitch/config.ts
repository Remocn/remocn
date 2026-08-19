import { sustainedGlitchExampleCode } from "@/components/docs/examples/sustained-glitch-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const sustainedGlitchConfig: ComponentConfig = {
  componentName: "SustainedGlitch",
  importPath: "@/components/remocn/sustained-glitch",
  controls: {
    intensity: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 1,
      description: "Intensity",
      hiddenFromList: false,
    },
    frequency: {
      type: "number",
      min: 0.1,
      max: 6,
      step: 0.1,
      default: 1,
      description: "Frequency",
      hiddenFromList: false,
    },
    slices: {
      type: "number",
      min: 6,
      max: 48,
      step: 1,
      default: 24,
      description: "Slices",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      min: 1,
      max: 20,
      step: 1,
      default: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: sustainedGlitchExampleCode,
};
