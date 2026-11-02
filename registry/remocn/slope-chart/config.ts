import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const slopeChartConfig: ComponentConfig = {
  componentName: "SlopeChart",
  importPath: "@/components/remocn/slope-chart",
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
      default: "6.8×",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "more launch videos shipped",
      description: "Label",
    },
    beforeLabel: {
      type: "text-content",
      default: "Before",
      description: "Before label",
    },
    afterLabel: {
      type: "text-content",
      default: "After",
      description: "After label",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
