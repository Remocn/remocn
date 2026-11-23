import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const stemStretchConfig: ComponentConfig = {
  componentName: "StemStretch",
  importPath: "@/components/remocn/stem-stretch",
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
    value: {
      type: "text-content",
      default: "4 hours",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "back, every week",
      description: "Label",
    },
    steps: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Steps",
      hiddenFromList: false,
    },
    snapGap: {
      type: "number",
      default: 12,
      min: 2,
      max: 30,
      step: 1,
      description: "Snap gap (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
