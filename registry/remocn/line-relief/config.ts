import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const lineReliefConfig: ComponentConfig = {
  componentName: "LineRelief",
  importPath: "@/components/remocn/line-relief",
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
    word: {
      type: "text-content",
      default: "LAUNCH",
      description: "Word",
    },
    count: {
      type: "number",
      default: 40,
      min: 10,
      max: 80,
      step: 1,
      description: "Lines",
      hiddenFromList: false,
    },
    sweep: {
      type: "number",
      default: 16,
      min: 0,
      max: 60,
      step: 1,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ grain: true }),
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
