import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wordLadderConfig: ComponentConfig = {
  componentName: "WordLadder",
  importPath: "@/components/remocn/word-ladder",
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
  durationInFrames: 186,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
