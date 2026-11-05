import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wordInsertConfig: ComponentConfig = {
  componentName: "WordInsert",
  importPath: "@/components/remocn/word-insert",
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
  durationInFrames: 174,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
