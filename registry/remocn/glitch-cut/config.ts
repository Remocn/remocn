import { glitchCutExampleCode } from "@/components/docs/examples/glitch-cut-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glitchCutConfig: ComponentConfig = {
  componentName: "glitchCut",
  importPath: "@/components/remocn/glitch-cut",
  controls: {
    intensity: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.1,
      default: 1,
      description: "Intensity",
      hiddenFromList: false,
    },
    slices: {
      type: "number",
      min: 8,
      max: 64,
      step: 2,
      default: 24,
      description: "Slices",
      hiddenFromList: false,
    },
    rgbSplit: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.1,
      default: 1,
      description: "RGB split",
      hiddenFromList: false,
    },
    blockNoise: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.6,
      description: "Block noise",
      hiddenFromList: false,
    },
  },
  durationInFrames: 78,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: glitchCutExampleCode,
};
