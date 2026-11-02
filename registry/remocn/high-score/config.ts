import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const highScoreConfig: ComponentConfig = {
  componentName: "HighScore",
  importPath: "@/components/remocn/high-score",
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
    player: {
      type: "text-content",
      default: "RMC",
      description: "Player",
    },
    title: {
      type: "text-content",
      default: "HIGH SCORES",
      description: "Title",
    },
    flash: {
      type: "text-content",
      default: "NEW HIGH SCORE",
      description: "Flash",
    },
    playerScore: {
      type: "number",
      default: 999990,
      min: 0,
      max: 2999970,
      step: 1,
      description: "Player score",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
