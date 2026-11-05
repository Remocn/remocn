import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chartMorphConfig: ComponentConfig = {
  componentName: "ChartMorph",
  importPath: "@/components/remocn/chart-morph",
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
    suffix: {
      type: "text-content",
      default: "k",
      description: "Suffix",
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
  durationInFrames: 182,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
