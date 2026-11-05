import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wordActsConfig: ComponentConfig = {
  componentName: "WordActs",
  importPath: "@/components/remocn/word-acts",
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
    hold: {
      type: "number",
      default: 32,
      min: 0,
      max: 96,
      step: 1,
      description: "Hold",
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
  durationInFrames: 176,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
