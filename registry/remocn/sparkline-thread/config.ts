import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const sparklineThreadConfig: ComponentConfig = {
  componentName: "SparklineThread",
  importPath: "@/components/remocn/sparkline-thread",
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
    metric: {
      type: "text-content",
      default: "+212%",
      description: "Metric",
    },
    label: {
      type: "text-content",
      default: "weekly renders",
      description: "Label",
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
