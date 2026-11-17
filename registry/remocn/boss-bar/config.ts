import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const bossBarConfig: ComponentConfig = {
  componentName: "BossBar",
  importPath: "@/components/remocn/boss-bar",
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
    boss: {
      type: "text-content",
      default: "THE OLD WORKFLOW",
      description: "Boss",
    },
    defeated: {
      type: "text-content",
      default: "DEFEATED",
      description: "Defeated",
    },
    tag: {
      type: "text-content",
      default: "BOSS",
      description: "Tag",
    },
    hitGap: {
      type: "number",
      default: 26,
      min: 10,
      max: 60,
      step: 1,
      description: "Hit gap (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Chakra Petch" }),
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
