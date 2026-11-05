import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const beeswarmConfig: ComponentConfig = {
  componentName: "Beeswarm",
  importPath: "@/components/remocn/beeswarm",
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
    axisLabel: {
      type: "text-content",
      default: "launch videos shipped per quarter",
      description: "Axis label",
    },
    totalLabel: {
      type: "text-content",
      default: "200 teams",
      description: "Total label",
    },
    count: {
      type: "number",
      default: 200,
      min: 0,
      max: 600,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    tickStep: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Tick step",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
