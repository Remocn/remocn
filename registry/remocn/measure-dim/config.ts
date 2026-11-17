import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const measureDimConfig: ComponentConfig = {
  componentName: "MeasureDim",
  importPath: "@/components/remocn/measure-dim",
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
    label: {
      type: "text-content",
      default: "remocn",
      description: "Label",
    },
    value: {
      type: "text-content",
      default: "184 fps",
      description: "Value",
    },
    before: {
      type: "text-content",
      default: "60 fps",
      description: "Before",
    },
    beforeLabel: {
      type: "text-content",
      default: "Before",
      description: "Before label",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 600,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    radius: {
      type: "number",
      default: 8,
      min: 0,
      max: 36,
      step: 1,
      description: "Corner radius",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Manrope", grain: true }),
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
