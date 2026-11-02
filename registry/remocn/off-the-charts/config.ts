import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const offTheChartsConfig: ComponentConfig = {
  componentName: "OffTheCharts",
  importPath: "@/components/remocn/off-the-charts",
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
    unit: {
      type: "text-content",
      default: "%",
      description: "Unit",
    },
    targetLabel: {
      type: "text-content",
      default: "Target",
      description: "Target label",
    },
    caption: {
      type: "text-content",
      default: "of the Q4 target",
      description: "Caption",
    },
    target: {
      type: "number",
      default: 100,
      min: 0,
      max: 300,
      step: 1,
      description: "Target",
      hiddenFromList: false,
    },
    max: {
      type: "number",
      default: 150,
      min: 0,
      max: 450,
      step: 1,
      description: "Max",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
