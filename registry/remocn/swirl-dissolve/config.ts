import { swirlDissolveExampleCode } from "@/components/docs/examples/swirl-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const swirlDissolveConfig: ComponentConfig = {
  componentName: "swirlDissolve",
  importPath: "@/components/remocn/swirl-dissolve",
  controls: {
    bandCount: {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      default: 10,
      description: "Bands",
      hiddenFromList: false,
    },
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.35,
      description: "Softness",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#141318",
      description: "Background",
    },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: swirlDissolveExampleCode,
};
