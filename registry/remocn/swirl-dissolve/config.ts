import { swirlDissolveExampleCode } from "@/components/docs/examples/swirl-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const swirlDissolveConfig: ComponentConfig = {
  componentName: "swirlDissolve",
  importPath: "@/components/remocn/swirl-dissolve",
  controls: {
    bandCount: {
      type: "number",
      default: 10,
      min: 1,
      max: 12,
      step: 1,
      label: "Bands",
    },
    softness: {
      type: "number",
      default: 0.35,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Softness",
    },
    colorBack: { type: "color", default: "#141318", label: "Background" },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: swirlDissolveExampleCode,
};
