import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const achievementPopConfig: ComponentConfig = {
  componentName: "AchievementPop",
  importPath: "@/components/remocn/achievement-pop",
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
    totalLabel: {
      type: "text-content",
      default: "Launch week",
      description: "Total label",
    },
    unit: {
      type: "text-content",
      default: "XP",
      description: "Points unit",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
