import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const spinnerConfig: ComponentConfig = {
  componentName: "Spinner",
  importPath: "@/components/remocn/spinner",
  controls: {
    size: {
      type: "number",
      default: 20,
      min: 8,
      max: 64,
      step: 2,
      label: "Size",
    },
    strokeWidth: {
      type: "number",
      default: 2.5,
      min: 1,
      max: 6,
      step: 0.5,
      label: "Stroke width",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
