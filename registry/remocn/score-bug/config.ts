import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const scoreBugConfig: ComponentConfig = {
  componentName: "ScoreBug",
  importPath: "@/components/remocn/score-bug",
  lists: {
    scorers: {
      default: ["Install 12′", "Ship 47′"],
      description: "Scorers",
    },
  },
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
    away: {
      type: "text-content",
      default: "Old way",
      description: "Away",
    },
    flash: {
      type: "text-content",
      default: "Shipped",
      description: "Flash",
    },
    liveLabel: {
      type: "text-content",
      default: "Live · 2nd half",
      description: "Live label",
    },
    finalLabel: {
      type: "text-content",
      default: "Full time",
      description: "Final label",
    },
    score: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Score",
      hiddenFromList: false,
    },
    awayScore: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Away score",
      hiddenFromList: false,
    },
    firstGoal: {
      type: "number",
      default: 30,
      min: 4,
      max: 90,
      step: 1,
      description: "First goal (frame)",
      hiddenFromList: false,
    },
    goalGap: {
      type: "number",
      default: 18,
      min: 6,
      max: 60,
      step: 1,
      description: "Goal gap (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Barlow Condensed", ink: false }),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
