import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const indexListConfig: ComponentConfig = {
  componentName: "IndexList",
  importPath: "@/components/remocn/index-list",
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
    title: {
      type: "text-content",
      default: "What’s inside 3.0",
      description: "Title",
    },
    highlight: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Highlight",
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
