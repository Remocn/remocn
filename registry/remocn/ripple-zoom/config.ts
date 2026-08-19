import { rippleZoomExampleCode } from "@/components/docs/examples/ripple-zoom-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rippleZoomConfig: ComponentConfig = {
  componentName: "rippleZoom",
  importPath: "@/components/remocn/ripple-zoom",
  controls: {
    zoom: {
      type: "number",
      min: 1.5,
      max: 8,
      step: 0.25,
      default: 4,
      description: "Zoom",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      description: "Intensity",
      hiddenFromList: false,
    },
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
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
  snippet: rippleZoomExampleCode,
};
