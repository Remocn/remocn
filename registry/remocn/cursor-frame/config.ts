import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cursorFrameConfig: ComponentConfig = {
  componentName: "CursorFrame",
  importPath: "@/components/remocn/cursor-frame",
  controls: {
    theme: {
      type: "enum",
      default: "light",
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
      default: "Launch videos, in code.",
      description: "Title",
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
  durationInFrames: 230,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
