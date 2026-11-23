import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const logRescaleConfig: ComponentConfig = {
  componentName: "LogRescale",
  importPath: "@/components/remocn/log-rescale",
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
      default: "remocn renders per year",
      description: "Title",
    },
    linearLabel: {
      type: "text-content",
      default: "Linear",
      description: "Linear tag",
    },
    logLabel: {
      type: "text-content",
      default: "Log",
      description: "Log tag",
    },
    morphAt: {
      type: "number",
      default: 64,
      min: 20,
      max: 100,
      step: 1,
      description: "Rescale at (frame)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Hanken Grotesk", grain: true }),
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
