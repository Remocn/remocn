import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const flowArrowConfig: ComponentConfig = {
  componentName: "FlowArrow",
  importPath: "@/components/remocn/flow-arrow",
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
      default: "3×",
      description: "Metric",
    },
    label: {
      type: "text-content",
      default: "faster growth",
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
  durationInFrames: 155,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
