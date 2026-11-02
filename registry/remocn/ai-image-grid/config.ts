import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const aiImageGridConfig: ComponentConfig = {
  componentName: "AiImageGrid",
  importPath: "@/components/remocn/ai-image-grid",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    prompt: {
      type: "text-content",
      default: "isometric glass city at sunrise, soft light",
      description: "Prompt",
    },
    model: {
      type: "text-content",
      default: "remocn Image 2",
      description: "Model",
    },
    layout: {
      type: "enum",
      default: "2x2",
      variants: {
        "2x2": {},
        "3x2": {},
      },
      description: "Layout",
    },
    pick: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
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
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
