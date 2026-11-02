import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const swipeDeckConfig: ComponentConfig = {
  componentName: "SwipeDeck",
  importPath: "@/components/remocn/swipe-deck",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    matchWith: {
      type: "text-content",
      default: "remocn",
      description: "Match with",
    },
    initials: {
      type: "text-content",
      default: "MC",
      description: "Initials",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
