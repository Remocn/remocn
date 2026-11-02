import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const stemStretchConfig: ComponentConfig = {
  componentName: "StemStretch",
  importPath: "@/components/remocn/stem-stretch",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    value: {
      type: "text-content",
      default: "4 hours",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "back, every week",
      description: "Label",
    },
    steps: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Steps",
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
