import { slideSwapExampleCode } from "@/components/docs/examples/slide-swap-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const slideSwapConfig: ComponentConfig = {
  componentName: "SlideSwapScenes",
  importPath: "@/components/remocn/slide-swap",
  controls: {
    axis: {
      type: "select",
      default: "x",
      options: ["x", "y"],
      label: "Axis",
    },
    inDistance: {
      type: "number",
      default: 0.28,
      min: 0.05,
      max: 0.8,
      step: 0.01,
      label: "Enter distance",
    },
    outDistance: {
      type: "number",
      default: 0.1,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "Exit distance",
    },
    slideFrames: {
      type: "number",
      default: 30,
      min: 12,
      max: 60,
      step: 1,
      label: "Enter window",
    },
  },
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: slideSwapExampleCode,
};
