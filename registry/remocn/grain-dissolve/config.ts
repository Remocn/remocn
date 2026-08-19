import { grainDissolveExampleCode } from "@/components/docs/examples/grain-dissolve-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const grainDissolveConfig: ComponentConfig = {
  componentName: "grainDissolve",
  importPath: "@/components/remocn/grain-dissolve",
  controls: {
    shape: {
      type: "enum",
      default: "blob",
      variants: {
        wave: {},
        dots: {},
        truchet: {},
        corners: {},
        ripple: {},
        blob: {},
        sphere: {},
      },
      description: "Shape",
    },
    noise: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.3,
      description: "Noise",
      hiddenFromList: false,
    },
    zoom: {
      type: "number",
      min: 0.5,
      max: 4,
      step: 0.25,
      default: 2,
      description: "Zoom",
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
  snippet: grainDissolveExampleCode,
};
