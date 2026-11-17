import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const streakRewardConfig: ComponentConfig = {
  componentName: "StreakReward",
  importPath: "@/components/remocn/streak-reward",
  lists: {
    lines: {
      default: ["Day seven. Still shipping.", "Small wins, every day."],
      description: "Lines",
      min: 2,
      max: 2,
    },
    days: {
      default: ["M", "T", "W", "T", "F", "S", "S"],
      description: "Days",
    },
  },
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
    streakLabel: {
      type: "text-content",
      default: "day streak",
      description: "Streak label",
    },
    note: {
      type: "text-content",
      default: "One more lesson keeps the week alive.",
      description: "Week note",
    },
    doneNote: {
      type: "text-content",
      default: "Seven for seven. Come back tomorrow for eight.",
      description: "Done note",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
