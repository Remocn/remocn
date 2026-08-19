import { slideSwapExampleCode } from "@/components/docs/examples/slide-swap-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const slideSwapConfig: ComponentConfig = {
  componentName: "SlideSwapScenes",
  importPath: "@/components/remocn/slide-swap",
  controls: {
    axis: {
      type: "enum",
      default: "x",
      variants: {
        x: {},
        y: {},
      },
      description: "Axis",
    },
    inDistance: {
      type: "number",
      min: 0.05,
      max: 0.8,
      step: 0.01,
      default: 0.28,
      description: "Enter distance",
      hiddenFromList: false,
    },
    outDistance: {
      type: "number",
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.1,
      description: "Exit distance",
      hiddenFromList: false,
    },
    slideFrames: {
      type: "number",
      min: 12,
      max: 60,
      step: 1,
      default: 30,
      description: "Enter window",
      hiddenFromList: false,
    },
  },
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: slideSwapExampleCode,
};
