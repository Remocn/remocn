import { perlinDissolveExampleCode } from "@/components/docs/examples/perlin-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const perlinDissolveConfig: ComponentConfig = {
  componentName: "perlinDissolve",
  importPath: "@/components/remocn/perlin-dissolve",
  controls: {
    colorFront: {
      type: "color",
      default: "#8f88ae",
      description: "Ink",
    },
    colorBack: {
      type: "color",
      default: "#141318",
      description: "Background",
    },
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.1,
      description: "Softness",
      hiddenFromList: false,
    },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: perlinDissolveExampleCode,
};
