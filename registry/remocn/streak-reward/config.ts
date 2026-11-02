import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const streakRewardConfig: ComponentConfig = {
  componentName: "StreakReward",
  importPath: "@/components/remocn/streak-reward",
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
    title: {
      type: "text-content",
      default: "Lesson complete",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "No mistakes across 14 answers.",
      description: "Subtitle",
    },
    cta: {
      type: "text-content",
      default: "Continue",
      description: "Cta",
    },
    streak: {
      type: "number",
      default: 7,
      min: 0,
      max: 21,
      step: 1,
      description: "Streak",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
