import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const splitWordConfig: ComponentConfig = {
  componentName: "SplitWord",
  importPath: "@/components/remocn/split-word",
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
    word: {
      type: "text-content",
      default: "Now",
      description: "Word",
    },
    insert: {
      type: "text-content",
      default: "Available",
      description: "Insert",
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
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
