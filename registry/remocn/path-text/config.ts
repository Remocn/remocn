import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pathTextConfig: ComponentConfig = {
  componentName: "PathText",
  importPath: "@/components/remocn/path-text",
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
    text: {
      type: "text-content",
      default: "From rough to ready.",
      description: "Text",
    },
    italicWords: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Italic words",
      hiddenFromList: false,
    },
    looseness: {
      type: "number",
      default: 0.15,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Looseness",
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
