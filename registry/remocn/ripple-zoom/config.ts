import { rippleZoomExampleCode } from "@/components/docs/examples/ripple-zoom-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rippleZoomConfig: ComponentConfig = {
  componentName: "rippleZoom",
  importPath: "@/components/remocn/ripple-zoom",
  controls: {
    zoom: {
      type: "number",
      default: 4,
      min: 1.5,
      max: 8,
      step: 0.25,
      label: "Zoom",
    },
    intensity: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Intensity",
    },
    softness: {
      type: "number",
      default: 0.5,
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
  snippet: rippleZoomExampleCode,
};
