import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const stackedShiftConfig: ComponentConfig = {
  componentName: "StackedShift",
  importPath: "@/components/remocn/stacked-shift",
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
    caption: {
      type: "text-content",
      default: "of launch videos",
      description: "Caption",
    },
    highlight: {
      type: "number",
      default: 0,
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
  durationInFrames: 178,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
