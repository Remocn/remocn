import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bracketWinConfig: ComponentConfig = {
  componentName: "BracketWin",
  importPath: "@/components/remocn/bracket-win",
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
    title: {
      type: "text-content",
      default: "Champion",
      description: "Title",
    },
    caption: {
      type: "text-content",
      default: "Playoffs 2026 · 8 teams · 0 maps dropped",
      description: "Caption",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
