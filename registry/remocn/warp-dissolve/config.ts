import { warpDissolveExampleCode } from "@/components/docs/examples/warp-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const warpDissolveConfig: ComponentConfig = {
  componentName: "warpDissolve",
  importPath: "@/components/remocn/warp-dissolve",
  controls: {
    distortion: {
      type: "number",
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.8,
      description: "Distortion",
      hiddenFromList: false,
    },
    swirl: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.6,
      description: "Swirl",
      hiddenFromList: false,
    },
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
      description: "Softness",
      hiddenFromList: false,
    },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: warpDissolveExampleCode,
};
