import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const specSheetConfig: ComponentConfig = {
  componentName: "SpecSheet",
  importPath: "@/components/remocn/spec-sheet",
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
      default: "Tech specs",
      description: "Title",
    },
    name: {
      type: "text-content",
      default: "3.0",
      description: "Name",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
