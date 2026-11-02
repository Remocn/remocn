import { lightLeakExampleCode } from "@/components/docs/examples/light-leak-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lightLeakConfig: ComponentConfig = {
  componentName: "lightLeak",
  importPath: "@/components/remocn/light-leak",
  controls: {
    origin: {
      type: "enum",
      default: "left",
      variants: {
        left: {},
        right: {},
        top: {},
        bottom: {},
      },
      description: "Origin",
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
    leakColor: {
      type: "color",
      default: "#FF5A1F",
      description: "Leak color",
    },
    blowoutColor: {
      type: "color",
      default: "#FFF3E0",
      description: "Blow-out color",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: lightLeakExampleCode,
};
