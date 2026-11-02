import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const reelsFeedConfig: ComponentConfig = {
  componentName: "ReelsFeed",
  importPath: "@/components/remocn/reels-feed",
  controls: {
    theme: {
      type: "enum",
      default: "light",
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
    account: {
      type: "text-content",
      default: "remocn",
      description: "Account",
    },
    pollQuestion: {
      type: "text-content",
      default: "Shipping a launch video this week?",
      description: "Poll question",
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
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
