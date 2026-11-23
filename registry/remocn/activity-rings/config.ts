import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const activityRingsConfig: ComponentConfig = {
  componentName: "ActivityRings",
  importPath: "@/components/remocn/activity-rings",
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
    title: {
      type: "text-content",
      default: "This month",
      description: "Title",
    },
    goalLabel: {
      type: "text-content",
      default: "of goal",
      description: "Goal label",
    },
    fill: {
      type: "number",
      default: 42,
      min: 12,
      max: 90,
      step: 1,
      description: "Fill (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
