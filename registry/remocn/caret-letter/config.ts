import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caretLetterConfig: ComponentConfig = {
  componentName: "CaretLetter",
  importPath: "@/components/remocn/caret-letter",
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
    word: {
      type: "text-content",
      default: "launch",
      description: "Word",
    },
    subline: {
      type: "text-content",
      default: "Animated components for your next release.",
      description: "Subline",
    },
    stemIndex: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Stem index",
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
  durationInFrames: 225,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
