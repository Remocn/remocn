import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const waterfallChartConfig: ComponentConfig = {
  componentName: "WaterfallChart",
  importPath: "@/components/remocn/waterfall-chart",
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
    totalLabel: {
      type: "text-content",
      default: "MRR",
      description: "Total label",
    },
    title: {
      type: "text-content",
      default: "Net revenue, Q3",
      description: "Title",
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
