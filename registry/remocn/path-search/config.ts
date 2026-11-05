import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pathSearchConfig: ComponentConfig = {
  componentName: "PathSearch",
  importPath: "@/components/remocn/path-search",
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
    startLabel: {
      type: "text-content",
      default: "Start",
      description: "Start label",
    },
    goalLabel: {
      type: "text-content",
      default: "Goal",
      description: "Goal label",
    },
    cols: {
      type: "number",
      default: 17,
      min: 0,
      max: 51,
      step: 1,
      description: "Cols",
      hiddenFromList: false,
    },
    rows: {
      type: "number",
      default: 9,
      min: 0,
      max: 27,
      step: 1,
      description: "Rows",
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
