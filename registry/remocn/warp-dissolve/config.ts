import { warpDissolveExampleCode } from "@/components/docs/examples/warp-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const warpDissolveConfig: ComponentConfig = {
  componentName: "warpDissolve",
  importPath: "@/components/remocn/warp-dissolve",
  controls: {
    distortion: {
      type: "number",
      default: 0.8,
      min: 0.1,
      max: 1,
      step: 0.05,
      label: "Distortion",
    },
    swirl: {
      type: "number",
      default: 0.6,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Swirl",
    },
    softness: {
      type: "number",
      default: 1,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Softness",
    },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: warpDissolveExampleCode,
};
