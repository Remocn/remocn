import { smokeDissolveExampleCode } from "@/components/docs/examples/smoke-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const smokeDissolveConfig: ComponentConfig = {
  componentName: "smokeDissolve",
  importPath: "@/components/remocn/smoke-dissolve",
  controls: {
    ringColor: {
      type: "color",
      default: "#8f88ae",
      description: "Ring",
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
  snippet: smokeDissolveExampleCode,
};
