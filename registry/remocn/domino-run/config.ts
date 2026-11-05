import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dominoRunConfig: ComponentConfig = {
  componentName: "DominoRun",
  importPath: "@/components/remocn/domino-run",
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
      default: "10×",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "Every push tips a bigger one.",
      description: "Caption",
    },
    count: {
      type: "number",
      default: 13,
      min: 0,
      max: 39,
      step: 1,
      description: "Count",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
