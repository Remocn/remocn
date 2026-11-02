import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const levelUpConfig: ComponentConfig = {
  componentName: "LevelUp",
  importPath: "@/components/remocn/level-up",
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
      default: "LEVEL UP",
      description: "Title",
    },
    level: {
      type: "number",
      default: 41,
      min: 0,
      max: 123,
      step: 1,
      description: "Level",
      hiddenFromList: false,
    },
    startXp: {
      type: "number",
      default: 2800,
      min: 0,
      max: 8400,
      step: 1,
      description: "Start xp",
      hiddenFromList: false,
    },
    maxXp: {
      type: "number",
      default: 4000,
      min: 0,
      max: 12000,
      step: 1,
      description: "Max xp",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
