import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const magnetLettersConfig: ComponentConfig = {
  componentName: "MagnetLetters",
  importPath: "@/components/remocn/magnet-letters",
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
    before: {
      type: "text-content",
      default: "Launch ",
      description: "Before",
    },
    word: {
      type: "text-content",
      default: "videos",
      description: "Word",
    },
    after: {
      type: "text-content",
      default: ", in code.",
      description: "After",
    },
    wrongWord: {
      type: "text-content",
      default: "slides",
      description: "Wrong word",
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
  durationInFrames: 255,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
