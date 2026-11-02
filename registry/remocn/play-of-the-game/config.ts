import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const playOfTheGameConfig: ComponentConfig = {
  componentName: "PlayOfTheGame",
  importPath: "@/components/remocn/play-of-the-game",
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
      default: "Play of the game",
      description: "Title",
    },
    role: {
      type: "text-content",
      default: "Solo builder",
      description: "Role",
    },
    stat: {
      type: "text-content",
      default: "Shipped in 6 hours",
      description: "Stat",
    },
    highlight: {
      type: "text-content",
      default: "6 hours",
      description: "Highlight",
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
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
