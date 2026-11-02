import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const typoFixConfig: ComponentConfig = {
  componentName: "TypoFix",
  importPath: "@/components/remocn/typo-fix",
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
    wrong: {
      type: "text-content",
      default: "Lanuch",
      description: "Wrong",
    },
    correct: {
      type: "text-content",
      default: "Launch",
      description: "Correct",
    },
    before: {
      type: "text-content",
      default: "",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "day",
      description: "After",
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
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
