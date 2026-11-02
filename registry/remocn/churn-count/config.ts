import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const churnCountConfig: ComponentConfig = {
  componentName: "ChurnCount",
  importPath: "@/components/remocn/churn-count",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    label: {
      type: "text-content",
      default: "frames played back live, straight from your props",
      description: "Label",
    },
    value: {
      type: "number",
      default: 72960,
      min: 0,
      max: 218880,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
