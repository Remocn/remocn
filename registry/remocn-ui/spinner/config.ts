import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const spinnerConfig: ComponentConfig = {
  componentName: "Spinner",
  importPath: "@/components/remocn/spinner",
  controls: {
    size: {
      type: "number",
      min: 8,
      max: 64,
      step: 2,
      default: 20,
      description: "Size",
      hiddenFromList: false,
    },
    strokeWidth: {
      type: "number",
      min: 1,
      max: 6,
      step: 0.5,
      default: 2.5,
      description: "Stroke width",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
